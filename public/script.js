// --- Configuration ---
// <-- IMPORTANT: set this to match your backend port / deployed URL -->
const BASE_URL = 'https://melodystream.onrender.com/';

// --- DOM Elements ---
// ================= Hamburger Menu Toggle ================= //
const hamburgerBtn = document.getElementById("hamburger-btn");
const mainNav = document.getElementById("main-nav");

hamburgerBtn.addEventListener("click", () => {
    mainNav.classList.toggle("show");
});

const views = {
    auth: document.getElementById('auth-view'),
    main: document.getElementById('main-view'),
    favorites: document.getElementById('favorites-view'),
    playlists: document.getElementById('playlist-view'),
    profile: document.getElementById('profile-view'),
    playlistDetail: document.getElementById('playlist-detail-view'),
    admin: document.getElementById('admin-view'),
};

const nav = document.getElementById('main-nav');
const navAdminBtn = document.getElementById('nav-admin');
const playerFooter = document.getElementById('music-player');
const audioElement = document.getElementById('audio-element');
const playerPlayPause = document.getElementById('player-play-pause');
const playerTitle = document.getElementById('player-title');
const playerArtist = document.getElementById('player-artist');
const playerCurrentTime = document.getElementById('player-current-time');
const playerDuration = document.getElementById('player-duration');
const playerSeek = document.getElementById('player-seek');

// --- Global State ---
let currentSong = null;
let currentQueue = []; 
let currentSongIndex = -1; 
let userPlaylists = [];
let allSongs = []; 
let userFavorites = []; 
let isAuthenticated = !!localStorage.getItem('token');
let userRole = localStorage.getItem('userRole') || 'user';
// Global variable to track current user's ID
let currentUserId = localStorage.getItem('userId') || null; 


// --- Utility Functions ---
// method: 'GET' | 'POST' | 'PUT' | 'DELETE' etc.
// isFormData: true when sending FormData (do not set Content-Type manually)
function getHeaders(isFormData = false, method = 'GET') {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    // Only set Content-Type for JSON body methods (and when not FormData)
    const jsonMethods = ['POST', 'PUT', 'PATCH'];
    if (!isFormData && jsonMethods.includes(method)) {
        headers['Content-Type'] = 'application/json';
    }
    return headers;
}

function showView(viewName) {
    Object.values(views).forEach(view => view.style.display = 'none');
    views[viewName].style.display = 'block';

    document.querySelectorAll('#main-nav button').forEach(btn => btn.classList.remove('active'));
    if (viewName !== 'auth') {
        const navTarget = viewName === 'playlistDetail' ? 'playlists' : (viewName.includes('-') ? viewName.split('-')[0] : viewName);
        const navBtn = document.getElementById(`nav-${navTarget}`);
        if(navBtn) navBtn.classList.add('active');
    }
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

function renderMessage(container, type, text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = text;
    const dedicatedMessageContainer = container.querySelector('#auth-message, #songs-message, #playlist-message, #profile-message, #admin-message, #modal-message, #detail-message');
    
    if (dedicatedMessageContainer) {
        dedicatedMessageContainer.innerHTML = '';
        dedicatedMessageContainer.appendChild(messageDiv);
    } else {
        container.prepend(messageDiv);
    }
    
    setTimeout(() => messageDiv.remove(), 5000);
}

// --- Auth View ---
function renderAuthView() {
    views.auth.innerHTML = `
        <div class="auth-container">
            <h2>Welcome to MelodyStream</h2>
            <div id="auth-message"></div>
            <form id="login-form" class="auth-form">
                <h3>Login</h3>
                <input type="email" id="login-email" placeholder="Email" required>
                <input type="password" id="login-password" placeholder="Password" required>
                <button type="submit">Login</button>
                <button type="button" id="switch-to-signup" class="secondary-action">Need an account? Sign Up</button>
            </form>
            <form id="signup-form" class="auth-form" style="display:none;">
                <h3>Sign Up</h3>
                <input type="text" id="signup-username" placeholder="Username" required>
                <input type="email" id="signup-email" placeholder="Email" required>
                <input type="password" id="signup-password" placeholder="Password" required>
                <button type="submit">Sign Up</button>
                <button type="button" id="switch-to-login" class="secondary-action">Have an account? Login</button>
            </form>
        </div>
    `;

    const authContainer = document.getElementById('auth-view');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    document.getElementById('switch-to-signup').addEventListener('click', () => {
        loginForm.style.display = 'none';
        signupForm.style.display = 'flex';
    });

    document.getElementById('switch-to-login').addEventListener('click', () => {
        signupForm.style.display = 'none';
        loginForm.style.display = 'flex';
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = e.target['login-email'].value;
        const password = e.target['login-password'].value;
        await handleAuth('/login', { email, password }, authContainer);
    });

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = e.target['signup-username'].value;
        const email = e.target['signup-email'].value;
        const password = e.target['signup-password'].value;
        await handleAuth('/signup', { username, email, password }, authContainer);
    });
}


async function handleAuth(endpoint, data, container) {
    try {
        // Use POST method for auth calls - inform getHeaders
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: getHeaders(false, 'POST'),
            body: JSON.stringify(data)
        });
        const result = await response.json();

        if (response.ok) {
            renderMessage(container, 'success', result.message);
            if (endpoint === '/login') {
                localStorage.setItem('token', result.token);
                isAuthenticated = true;
                
                // Fetch profile immediately after login to get the current role, ID, and favorites
                const profileResponse = await fetch(`${BASE_URL}/profile`, { headers: getHeaders(false, 'GET') });
                if (profileResponse.ok) {
                    const profileData = await profileResponse.json();
                    userRole = profileData.user.role || 'user';
                    userFavorites = profileData.user.favorites || [];
                    localStorage.setItem('userRole', userRole); 
                    // Store user ID locally
                    localStorage.setItem('userId', profileData.user._id); 
                    currentUserId = profileData.user._id; // Update global state
                }
                initApp();
            } else if (endpoint === '/signup') {
                // After signup switch to login view. If you want auto-login on signup, you can store token here if backend returns it.
                document.getElementById('signup-form').style.display = 'none';
                document.getElementById('login-form').style.display = 'flex';
            }
        } else {
            renderMessage(container, 'error', result.message || 'Authentication failed.');
        }
    } catch (error) {
        console.error("Auth network error:", error);
        renderMessage(container, 'error', 'Network error during authentication.');
    }
}

// --- Initial Data Fetching & Rendering ---
async function fetchAllData() {
    try {
        // 1. Fetch all songs
        const songsResponse = await fetch(`${BASE_URL}/songs`);
        const songsData = await songsResponse.json();
        allSongs = songsData.songs || [];

        // 2. Fetch profile/favorites and playlists (if authenticated)
        if (isAuthenticated) {
            // Re-fetch profile to ensure latest favorites and role are loaded
            const profileResponse = await fetch(`${BASE_URL}/profile`, { headers: getHeaders(false, 'GET') });
            if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                userFavorites = profileData.user.favorites || []; 
                userRole = profileData.user.role || 'user'; 
                localStorage.setItem('userRole', userRole); 
                localStorage.setItem('userId', profileData.user._id); // Ensure ID is up to date
                currentUserId = profileData.user._id;
            }
            await fetchPlaylists(false); // Fetch playlists for modal access
        }

        // 3. Conditionally display Admin button
        if (userRole === 'admin') {
            navAdminBtn.style.display = 'block';
        } else {
            navAdminBtn.style.display = 'none';
        }

        // 4. Display the main songs view
        renderSongList(allSongs, views.main, '', 'All Songs'); 

    } catch (error) {
        console.error("fetchAllData error:", error);
        renderMessage(views.main, 'error', 'Failed to load initial data. Make sure your backend is running.');
    }
}

function renderSongList(songs, container, currentQuery = '', title = 'All Songs') {
    
    const currentSongList = songs; 
    const showSearch = container === views.main; 

    container.innerHTML = `
        <h2>${title}${currentQuery ? ` (${currentQuery})` : ''}</h2>
        ${showSearch ? `
            <form id="song-search-form" class="search-form">
                <input type="text" id="search-query" placeholder="Search by title, artist, or album..." value="${currentQuery}" required>
                <button type="submit"><i class="fas fa-search"></i> Search</button>
                ${currentQuery ? `<button type="button" id="clear-search" class="secondary-action"><i class="fas fa-times"></i> Clear</button>` : ''}
            </form>
        ` : ''}
        <div id="songs-message"></div>
        <div class="song-list">
            ${songs.length > 0 ? songs.map(song => `
                <div class="song-item" data-song-id="${song._id}">
                    <div class="song-details">
                        <p>${song.title}</p>
                        <p>${song.artist} - ${song.album}</p>
                    </div>
                    <div class="song-actions">
                        <button class="play-btn" data-song='${JSON.stringify(song).replace(/'/g, "&apos;")}' title="Play Song"><i class="fas fa-play"></i></button>
                        <button class="fav-btn ${isAuthenticated && userFavorites.includes(song._id) ? 'favorited' : ''}" data-song-id="${song._id}" title="Toggle Favorite" ${!isAuthenticated ? 'disabled' : ''}>
                            <i class="fas fa-heart"></i>
                        </button>
                        <button class="add-playlist-btn" data-song-id="${song._id}" title="Add to Playlist" ${!isAuthenticated ? 'disabled' : ''}>
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
            `).join('') : `<p style="text-align: center;">${currentQuery ? 'No songs found matching your search query.' : (container === views.favorites ? 'You have no favorite songs yet.' : 'No songs are available.')}</p>`}
        </div>
    `;

    if (showSearch) {
        document.getElementById('song-search-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const searchQuery = e.target['search-query'].value.trim();
            if (searchQuery) {
                fetchSearchResults(searchQuery);
            }
        });
        if (currentQuery) {
            document.getElementById('clear-search').addEventListener('click', () => {
                renderSongList(allSongs, views.main, '', 'All Songs'); 
            });
        }
    }
    
    container.querySelectorAll('.play-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const song = JSON.parse(e.currentTarget.dataset.song.replace(/&apos;/g, "'"));
            const index = currentSongList.findIndex(s => s._id === song._id);
            playSong(song, currentSongList, index); 
        });
    });

    container.querySelectorAll('.fav-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const songId = e.currentTarget.dataset.songId;
            toggleFavorite(songId, button);
        });
    });

    container.querySelectorAll('.add-playlist-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const songId = e.currentTarget.dataset.songId;
            openPlaylistModal(songId);
        });
    });

    showView(container === views.main ? 'main' : (container === views.favorites ? 'favorites' : (container === views.playlistDetail ? 'playlistDetail' : 'main')));
}

async function fetchSearchResults(query) {
    try {
        const response = await fetch(`${BASE_URL}/songs/search?query=${encodeURIComponent(query)}`);
        const result = await response.json();
        
        if (response.ok) {
            renderSongList(result.songs || [], views.main, query, 'Search Results');
        } else {
             renderMessage(views.main, 'error', result.message || 'Search failed.');
        }

    } catch (error) {
         renderMessage(views.main, 'error', 'Network error during search.');
    }
}

function renderFavoritesView() {
    if (!isAuthenticated) return renderMessage(views.favorites, 'error', 'Please log in to view favorites.');
    const favoriteSongs = allSongs.filter(song => userFavorites.includes(song._id));
    renderSongList(favoriteSongs, views.favorites, '', 'My Favorite Songs'); 
}

async function toggleFavorite(songId, button) {
    if (!isAuthenticated) return renderMessage(views.main, 'error', 'Please log in to manage favorites.');
    const isFavorited = userFavorites.includes(songId);
    // Assuming favouriteRoutes are directly mounted to root like /songs/:id/favourite
    const endpoint = isFavorited ? `/songs/${songId}/unfavourite` : `/songs/${songId}/favourite`;
    const action = isFavorited ? 'removed from' : 'added to';
    try {
        // Inform getHeaders this is a POST
        const response = await fetch(`${BASE_URL}${endpoint}`, { method: 'POST', headers: getHeaders(false, 'POST') });
        const result = await response.json();
        if (response.ok) {
            if (isFavorited) {
                userFavorites = userFavorites.filter(id => id !== songId);
            } else {
                userFavorites.push(songId);
            }
            document.querySelectorAll(`.fav-btn[data-song-id="${songId}"]`).forEach(btn => {
                btn.classList.toggle('favorited', !isFavorited);
            });
            if (document.getElementById('favorites-view').style.display === 'block') {
                renderFavoritesView();
            }
            renderMessage(document.getElementById('songs-message') || views.main, 'success', `Song ${action} favorites.`);
        } else {
            renderMessage(document.getElementById('songs-message') || views.main, 'error', result.message || `Failed to ${action} favorites.`);
        }
    } catch (error) {
        console.error("toggleFavorite error:", error);
        renderMessage(views.main, 'error', 'Network error while updating favorites.');
    }
}

async function fetchPlaylists(render = true) {
    if (!isAuthenticated) return;
    try {
        // Now fetches ALL playlists (user's + admin's) from the updated backend
        const response = await fetch(`${BASE_URL}/playlists`, { headers: getHeaders(false, 'GET') });
        const result = await response.json();
        if (response.ok) {
            userPlaylists = result.data || [];
            if(render) renderPlaylists(userPlaylists);
        } else {
            if(render) renderMessage(views.playlists, 'error', result.error || 'Failed to fetch playlists.');
        }
    } catch (error) {
        console.error("fetchPlaylists error:", error);
        if(render) renderMessage(views.playlists, 'error', 'Network error while fetching playlists.');
    }
}


function renderPlaylists(playlists) {
    views.playlists.innerHTML = `
        <h2>All Playlists</h2> 
        <div id="playlist-message"></div>
        <form id="create-playlist-form" style="margin-bottom: 20px;">
            <input type="text" id="playlist-name" placeholder="New Playlist Name" required style="padding: 10px; width: 250px; margin-right: 10px;">
            <input type="text" id="playlist-description" placeholder="Description (Optional)" style="padding: 10px; width: 250px; margin-right: 10px;">
            <button type="submit">Create Playlist</button>
        </form>
        <div class="playlist-list">
            ${playlists.length > 0 ? playlists.map(p => {
                // Determine if the current user is the creator
                const isCreator = p.createdBy && String(p.createdBy._id) === String(currentUserId); 
                const creatorText = p.createdBy ? `Created by: ${p.createdBy.username}` : 'Creator Unknown';
                
                return `
                <div class="playlist-item" data-playlist-id="${p._id}">
                    <div class="song-details" onclick="fetchPlaylistDetails('${p._id}')">
                        <p>${p.name}</p>
                        <p>${p.description || 'No description'} - ${creatorText}</p>
                    </div>
                    <div class="playlist-actions">
                        ${isCreator ? `
                            <button class="delete-playlist-btn" data-playlist-id="${p._id}" title="Delete Playlist"><i class="fas fa-trash-alt"></i></button>
                        ` : ''}
                    </div>
                </div>
                `;
            }).join('') : '<p>No playlists found. Create one above!</p>'}
        </div>
    `;
    document.getElementById('create-playlist-form').addEventListener('submit', handleCreatePlaylist);
    views.playlists.querySelectorAll('.delete-playlist-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const playlistId = e.currentTarget.dataset.playlistId;
            if (confirm('Are you sure you want to delete this playlist?')) {
                handleDeletePlaylist(playlistId);
            }
        });
    });
    showView('playlists');
}

async function handleCreatePlaylist(e) {
    e.preventDefault();
    const name = e.target['playlist-name'].value;
    const description = e.target['playlist-description'].value;
    try {
        const response = await fetch(`${BASE_URL}/songs/playlist/create`, {
            method: 'POST',
            headers: getHeaders(false, 'POST'),
            body: JSON.stringify({ name, description })
        });
        const result = await response.json();
        if (response.ok) {
            renderMessage(document.getElementById('playlist-message'), 'success', 'Playlist created successfully!');
            fetchPlaylists(); 
        } else {
            renderMessage(document.getElementById('playlist-message'), 'error', result.message || 'Failed to create playlist.');
        }
    } catch (error) {
        console.error("handleCreatePlaylist error:", error);
        renderMessage(views.playlists, 'error', 'Network error while creating playlist.');
    }
}

async function handleDeletePlaylist(playlistId) {
    try {
        // The backend /:playlistId route now handles the auth and creator check
        const response = await fetch(`${BASE_URL}/${playlistId}`, { method: 'DELETE', headers: getHeaders(false, 'DELETE') }); 
        const result = await response.json();
        if (response.ok) {
            renderMessage(document.getElementById('playlist-message'), 'success', result.message);
            fetchPlaylists(); 
        } else {
            renderMessage(document.getElementById('playlist-message'), 'error', result.message || 'Failed to delete playlist.');
        }
    } catch (error) {
        console.error("handleDeletePlaylist error:", error);
        renderMessage(views.playlists, 'error', 'Network error while deleting playlist.');
    }
}

async function fetchPlaylistDetails(playlistId) {
    try {
        const response = await fetch(`${BASE_URL}/${playlistId}`, { headers: getHeaders(false, 'GET') });
        const result = await response.json();
        if (response.ok) {
            renderPlaylistDetails(result.playlist);
        } else {
            renderMessage(views.playlistDetail, 'error', result.message || 'Failed to fetch playlist details.');
        }
    } catch (error) {
        console.error("fetchPlaylistDetails error:", error);
        renderMessage(views.playlistDetail, 'error', 'Network error while fetching playlist details.');
    }
}

function renderPlaylistDetails(playlist) {
    views.playlistDetail.innerHTML = `
        <div id="detail-message"></div>
        <button id="back-to-playlists" class="secondary-action" style="margin-bottom: 20px;"><i class="fas fa-arrow-left"></i> Back to Playlists</button>
        <h2>${playlist.name} <small>(${playlist.songs.length} songs)</small></h2>
        <p style="color: var(--text-medium); margin-bottom: 20px;">Created by: ${playlist.createdBy ? playlist.createdBy.username : 'Unknown'}</p>
        <div class="song-list">
            ${playlist.songs.length > 0 ? playlist.songs.map(song => `
                <div class="song-item" data-song-id="${song._id}">
                    <div class="song-details">
                        <p>${song.title}</p>
                        <p>${song.artist} - ${song.album}</p>
                    </div>
                    <div class="song-actions">
                        <button class="play-btn-playlist" data-song='${JSON.stringify(song).replace(/'/g, "&apos;")}' title="Play Song"><i class="fas fa-play"></i></button>
                        ${playlist.createdBy && String(playlist.createdBy._id) === String(currentUserId) ? `
                            <button class="remove-from-playlist-btn danger" 
                                    data-playlist-id="${playlist._id}" 
                                    data-song-id="${song._id}" 
                                    title="Remove from Playlist">
                                <i class="fas fa-minus-circle"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            `).join('') : '<p>This playlist is empty.</p>'}
        </div>
    `;
    document.getElementById('back-to-playlists').addEventListener('click', () => fetchPlaylists(true));
    views.playlistDetail.querySelectorAll('.play-btn-playlist').forEach(button => {
        button.addEventListener('click', (e) => {
            const song = JSON.parse(e.currentTarget.dataset.song.replace(/&apos;/g, "'"));
            const currentQueue = playlist.songs;
            const index = currentQueue.findIndex(s => s._id === song._id);
            playSong(song, currentQueue, index);
        });
    });
    views.playlistDetail.querySelectorAll('.remove-from-playlist-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const playlistId = e.currentTarget.dataset.playlistId;
            const songId = e.currentTarget.dataset.songId;
            handleRemoveSongFromPlaylist(playlistId, songId);
        });
    });
    showView('playlistDetail');
}

async function handleRemoveSongFromPlaylist(playlistId, songId) {
    try {
        const response = await fetch(`${BASE_URL}/${playlistId}/remove/${songId}`, { method: 'POST', headers: getHeaders(false, 'POST') });
        const result = await response.json();
        if (response.ok) {
            renderMessage(document.getElementById('detail-message'), 'success', result.message);
            fetchPlaylistDetails(playlistId); 
        } else {
            renderMessage(document.getElementById('detail-message'), 'error', result.message || 'Failed to remove song.');
        }
    } catch (error) {
        console.error("handleRemoveSongFromPlaylist error:", error);
        renderMessage(views.playlistDetail, 'error', 'Network error while removing song.');
    }
}

function openPlaylistModal(songId) {
    if (!isAuthenticated) return renderMessage(views.main, 'error', 'Please log in to manage playlists.');
    fetchPlaylists(false); 

    // Filter userPlaylists to only show the current user's own playlists for adding songs
    const usersOwnPlaylists = userPlaylists.filter(p => p.createdBy && String(p.createdBy._id) === String(currentUserId));
    
    const modalHTML = `
        <div id="playlist-modal" class="modal" style="display: flex;">
            <div class="modal-content">
                <h3>Add Song to Playlist</h3>
                <div id="modal-message"></div>
                <div class="playlist-selector">
                    ${usersOwnPlaylists.length > 0 ? usersOwnPlaylists.map(p => `
                        <button data-playlist-id="${p._id}" class="select-playlist-btn">${p.name}</button>
                    `).join('') : '<p>You must create a playlist first to add songs. You can only add songs to playlists you have created.</p>'}
                </div>
                <button id="close-modal" class="secondary-action" style="margin-top: 15px; width: 100%;">Close</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('close-modal').addEventListener('click', closePlaylistModal);
    document.querySelectorAll('.select-playlist-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const playlistId = e.currentTarget.dataset.playlistId;
            handleAddToPlaylist(playlistId, songId);
        });
    });
}

function closePlaylistModal() {
    const modal = document.getElementById('playlist-modal');
    if (modal) modal.remove();
}

async function handleAddToPlaylist(playlistId, songId) {
    const modalMessageContainer = document.getElementById('modal-message');
    try {
        // The backend logic ensures only the playlist creator can add songs
        const response = await fetch(`${BASE_URL}/${playlistId}/add/${songId}`, {
            method: 'POST',
            headers: getHeaders(false, 'POST')
        });
        const result = await response.json();
        if (response.ok) {
            renderMessage(modalMessageContainer, 'success', 'Song added to playlist!');
            setTimeout(closePlaylistModal, 1000);
        } else {
            renderMessage(modalMessageContainer, 'error', result.message || 'Failed to add song.');
        }
    } catch (error) {
        console.error("handleAddToPlaylist error:", error);
        renderMessage(modalMessageContainer, 'error', 'Network error while adding song.');
    }
}

async function fetchAndRenderProfile() {
    if (!isAuthenticated) return;
    try {
        const response = await fetch(`${BASE_URL}/profile`, { headers: getHeaders(false, 'GET') });
        const result = await response.json();
        if (response.ok) {
            userRole = result.user.role || 'user'; 
            localStorage.setItem('userRole', userRole);
            renderProfile(result.user);
        } else {
            renderMessage(views.profile, 'error', result.message || 'Failed to fetch profile.');
        }
    } catch (error) {
        console.error("fetchAndRenderProfile error:", error);
        renderMessage(views.profile, 'error', 'Network error while fetching profile.');
    }
}

function renderProfile(user) {
    views.profile.innerHTML = `
        <h2>User Profile</h2>
        <div id="profile-message"></div>
        <div class="profile-details" style="text-align: center; margin-bottom: 30px;">
            ${user.avatar ? `<img src="${BASE_URL}${user.avatar}" alt="Avatar" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; margin-bottom: 10px;">` : `<i class="fas fa-user-circle" style="font-size: 5em; color: var(--text-medium);"></i>`}
            <p style="font-size: 1.5em; font-weight: bold; margin-top: 10px;">${user.username}</p>
            <p style="color: var(--text-medium);">${user.email}</p>
            <p style="font-size: 0.9em; color: var(--primary-color);">Role: ${user.role || 'user'}</p>
        </div>
        
        <h3>Update Profile</h3>
        <form id="profile-update-form" class="profile-form">
            <input type="text" id="update-username" placeholder="Username" value="${user.username || ''}">
            <input type="email" id="update-email" placeholder="Email" value="${user.email || ''}">
            <label for="update-avatar" style="font-size: 0.9em;">Change Avatar (Optional):</label>
            <input type="file" id="update-avatar" name="avatar" accept="image/*">
            <button type="submit">Update Profile</button>
        </form>
    `;
    document.getElementById('profile-update-form').addEventListener('submit', handleProfileUpdate);
    showView('profile');
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    const messageContainer = document.getElementById('profile-message');
    const formData = new FormData();
    const username = e.target['update-username'].value;
    const email = e.target['update-email'].value;
    const avatar = e.target['update-avatar'].files[0];
    if (username) formData.append('username', username);
    if (email) formData.append('email', email);
    if (avatar) formData.append('avatar', avatar);
    if (formData.entries().next().done) {
        return renderMessage(messageContainer, 'error', 'No fields to update.');
    }
    try {
        const response = await fetch(`${BASE_URL}/profile/update`, {
            method: 'PUT',
            headers: getHeaders(true, 'PUT'), 
            body: formData
        });
        const result = await response.json();
        if (response.ok) {
            renderMessage(messageContainer, 'success', result.message);
            renderProfile(result.user);
        } else {
            renderMessage(messageContainer, 'error', result.message || 'Failed to update profile.');
        }
    } catch (error) {
        console.error("handleProfileUpdate error:", error);
        renderMessage(views.profile, 'error', 'Network error while updating profile.');
    }
}


// CRITICAL FIX: Authenticated Music Player Logic using Fetch and Blob URL
async function playSong(song, queue, index) {
    if (!song || !song._id) return console.error("Invalid song object for playback.");

    if (!isAuthenticated) {
        renderMessage(views.main, 'error', 'Please log in to play music.');
        return;
    }

    // Memory Leak Fix: Revoke any previous Blob URL
    if (audioElement.src && audioElement.src.startsWith('blob:')) {
        URL.revokeObjectURL(audioElement.src);
    }
    
    currentQueue = queue;
    currentSongIndex = index;
    currentSong = song;

    playerTitle.textContent = song.title;
    playerArtist.textContent = song.artist;
    playerPlayPause.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; 
    playerFooter.style.display = 'flex';
    audioElement.pause(); 

    const streamUrl = `${BASE_URL}/songs/stream/${song._id}`;
    
    try {
        // 1. Use fetch to send the Authorization header for stream
        const response = await fetch(streamUrl, {
            headers: getHeaders(false, 'GET'), 
        });

        if (response.status === 401 || response.status === 403) {
            playerPlayPause.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
            return renderMessage(views.main, 'error', 'Unauthorized to stream music. Token might be expired.');
        }

        if (!response.ok) {
            throw new Error(`Stream request failed with status: ${response.status}`);
        }
        
        // 2. Convert the response data into a Blob
        const audioBlob = await response.blob();
        
        // 3. Create a temporary URL for the Blob
        const audioUrl = URL.createObjectURL(audioBlob);

        // 4. Assign the Blob URL to the audio element and play
        audioElement.src = audioUrl;
        audioElement.load();
        
        playerPlayPause.innerHTML = '<i class="fas fa-pause"></i>';
        
        // Handle autoplay permissions
        audioElement.play().catch(error => {
            console.error("Autoplay failed:", error);
            playerPlayPause.innerHTML = '<i class="fas fa-play"></i>';
            renderMessage(views.main, 'warning', 'Playback was blocked. Click the play button to start.');
        });
        
    } catch (error) {
        console.error("Stream fetch error:", error);
        playerPlayPause.innerHTML = '<i class="fas fa-times-circle"></i>';
        renderMessage(views.main, 'error', 'Failed to load music stream.');
    }
}

function playNextSong() {
    if (currentQueue.length <= 1 || currentSongIndex === -1) {
        audioElement.pause();
        return;
    }
    const nextIndex = (currentSongIndex + 1) % currentQueue.length;
    const nextSong = currentQueue[nextIndex];
    playSong(nextSong, currentQueue, nextIndex); 
}

function playPrevSong() {
    if (currentQueue.length <= 1 || currentSongIndex === -1) {
        audioElement.pause();
        return;
    }
    let prevIndex = currentSongIndex - 1;
    if (prevIndex < 0) {
        prevIndex = currentQueue.length - 1; 
    }
    const prevSong = currentQueue[prevIndex];
    playSong(prevSong, currentQueue, prevIndex);
}

// --- Player Event Listeners ---
playerPlayPause.addEventListener('click', () => {
    if (!currentSong) return;
    if (audioElement.paused) {
        audioElement.play();
        playerPlayPause.innerHTML = '<i class="fas fa-pause"></i>';
    } else {
        audioElement.pause();
        playerPlayPause.innerHTML = '<i class="fas fa-play"></i>';
    }
});
document.getElementById('player-next').addEventListener('click', playNextSong);
document.getElementById('player-prev').addEventListener('click', playPrevSong);
audioElement.addEventListener('ended', playNextSong);
audioElement.addEventListener('loadedmetadata', () => {
    playerDuration.textContent = formatTime(audioElement.duration);
    playerSeek.max = audioElement.duration;
});
audioElement.addEventListener('timeupdate', () => {
    playerCurrentTime.textContent = formatTime(audioElement.currentTime);
    playerSeek.value = audioElement.currentTime;
});
playerSeek.addEventListener('input', () => {
    audioElement.currentTime = playerSeek.value;
});

// --- Admin Panel Logic ---

async function fetchAdminData() {
    if (userRole !== 'admin') {
        return renderMessage(views.admin, 'error', 'You are not authorized to view the admin panel.');
    }

    try {
        const usersResponse = await fetch(`${BASE_URL}/admin/users`, { headers: getHeaders(false, 'GET') });
        
        if (usersResponse.status === 403) {
             return renderMessage(views.admin, 'error', 'Access Denied: Your admin privileges were revoked or token expired.');
        }
        
        const usersResult = await usersResponse.json();
        
        if (usersResponse.ok) {
            renderAdminView(usersResult.users || []);
        } else {
            renderMessage(views.admin, 'error', usersResult.message || 'Failed to fetch admin data.');
        }
    } catch (error) {
        console.error("fetchAdminData error:", error);
        renderMessage(views.admin, 'error', 'Network error while fetching admin data.');
    }
}


function renderAdminView(users) {
    views.admin.innerHTML = `
        <div id="admin-message"></div>
        <h2>Admin Dashboard 🛠️</h2>
        
        <section style="margin-bottom: 30px; padding: 20px; border: 1px solid #333; border-radius: 8px;">
            <h3>Upload New Song</h3>
            <form id="admin-song-upload-form" class="profile-form" style="max-width: 600px; margin: 0 auto;">
                <input type="text" name="title" placeholder="Title" required>
                <input type="text" name="artist" placeholder="Artist" required>
                <input type="text" name="album" placeholder="Album" required>
                <input type="number" name="duration" placeholder="Duration (seconds, e.g., 240)" required>
                <label for="song-file" style="font-size: 0.9em;">Audio File (MP3, WAV):</label>
                <input type="file" id="song-file" name="song" accept="audio/*" required>
                <button type="submit">Upload Song</button>
            </form>
        </section>

        <section style="padding: 20px;">
            <h3>All Users (${users.length})</h3>
            <div class="user-list" style="max-height: 400px; overflow-y: auto;">
                ${users.length > 0 ? users.map(user => `
                    <div class="song-item" style="cursor: default; background-color: ${user.role === 'admin' ? 'rgba(255, 215, 0, 0.1)' : 'var(--bg-card)'};">
                        <div class="song-details">
                            <p>${user.username} (Role: <strong>${user.role.toUpperCase()}</strong>)</p>
                            <p>${user.email}</p>
                        </div>
                    </div>
                `).join('') : '<p>No users found.</p>'}
            </div>
        </section>
    `;

    document.getElementById('admin-song-upload-form').addEventListener('submit', handleAdminSongUpload);

    showView('admin');
}

async function handleAdminSongUpload(e) {
    e.preventDefault();
    const messageContainer = document.getElementById('admin-message');
    const formData = new FormData(e.target);
    
    try {
        // Assuming Admin Upload Endpoint is: POST /admin/songs/upload
        const response = await fetch(`${BASE_URL}/admin/songs/upload`, {
            method: 'POST',
            headers: getHeaders(true, 'POST'), 
            body: formData
        });
        const result = await response.json();

        if (response.ok) {
            renderMessage(messageContainer, 'success', result.message || 'Song uploaded!');
            e.target.reset(); 
            fetchAllData(); 
        } else {
            renderMessage(messageContainer, 'error', result.message || 'Failed to upload song.');
        }

    } catch (error) {
        console.error("handleAdminSongUpload error:", error);
        renderMessage(messageContainer, 'error', 'Network error during file upload.');
    }
}

// --- Navigation and Routing ---
navAdminBtn.addEventListener('click', fetchAdminData); 

document.getElementById('nav-home').addEventListener('click', () => {
    renderSongList(allSongs, views.main, '', 'All Songs'); 
});

document.getElementById('nav-favorites').addEventListener('click', renderFavoritesView); 
document.getElementById('nav-playlists').addEventListener('click', () => fetchPlaylists(true));
document.getElementById('nav-profile').addEventListener('click', fetchAndRenderProfile);

document.getElementById('nav-logout').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole'); 
    localStorage.removeItem('userId'); 
    isAuthenticated = false;
    userRole = 'user';
    currentUserId = null; 
    navAdminBtn.style.display = 'none'; 
    nav.style.display = 'none';
    playerFooter.style.display = 'none';
    audioElement.pause();
    // Revoke any active Blob URL to prevent memory leaks
    if (audioElement.src && audioElement.src.startsWith('blob:')) {
        URL.revokeObjectURL(audioElement.src);
    }
    renderAuthView();
    showView('auth');
});


// --- Initialisation ---
function initApp() {
    // Check if token and role exists on load, and set state
    if (localStorage.getItem('token')) {
        isAuthenticated = true;
        userRole = localStorage.getItem('userRole') || 'user'; 
        currentUserId = localStorage.getItem('userId'); 
    } else {
        isAuthenticated = false;
        userRole = 'user';
        currentUserId = null;
    }

    if (isAuthenticated) {
        nav.style.display = 'flex';
        if (userRole === 'admin') {
            navAdminBtn.style.display = 'block';
        } else {
            navAdminBtn.style.display = 'none';
        }
        fetchAllData(); 
    } else {
        nav.style.display = 'none';
        navAdminBtn.style.display = 'none';
        renderAuthView();
        showView('auth');
    }
}

window.onload = initApp;
