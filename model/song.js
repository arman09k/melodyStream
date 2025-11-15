const mongoose = require("mongoose");

const songSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  artist :{
    type : String,
    required : true
  },
  album : {
    type : String
  },
  duration : {
    type : Number
  },
  audioUrl : {
    type : String,
    required : true
  },
  coverImage : {
    type : String
  },
  createdAt : {
    type : Date,
    default : Date.now
  }
});

songSchema.virtual("durationInMinutes").get(function () {
  return (this.durationInSeconds / 60).toFixed(2); // e.g. 3.50
});

songSchema.set("toJSON", { virtuals: true });


module.exports = mongoose.model('Song',songSchema)
