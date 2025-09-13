const mongoose = require('mongoose');


const MovieSchema = new mongoose.Schema({
	title: { type: String, required: true, index: true },
	genres: { type: [String], default: [] },
	releaseYear: { type: Number },
	director: { type: String },
	cast: { type: [String], default: [] },
	synopsis: { type: String },
	posterUrl: { type: String },
	averageRating: { type: Number, default: 0 },
	poster_path: { type: String }, // for TMDB compatibility
	release_date: { type: String }, // for TMDB compatibility
	vote_average: { type: Number }, // for TMDB compatibility
	popularity: { type: Number, index: true }, // for TMDB compatibility
	trailerUrl: { type: String }, // YouTube/TMDB trailer URL
	// ...other fields as needed
});

// Compound index for sorting/searching
MovieSchema.index({ title: 1, popularity: -1 });

module.exports = mongoose.model('Movie', MovieSchema);
