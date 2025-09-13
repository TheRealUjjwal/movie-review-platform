
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
  movies: [],
  featured: null,
  trending: [],
  movie: null,
  loading: false,
  error: null,
  hasMore: true,
  page: 1,
  pageSize: 100,
  total: 0,
};

// Async thunk to fetch movies (paginated)
// Accepts either page number or filter params object
export const fetchMovies = createAsyncThunk(
  'movies/fetchMovies',
  async (params = 1, { rejectWithValue }) => {
    try {
      let query = '';
      if (typeof params === 'object') {
        query = Object.entries(params)
          .filter(([k, v]) => v !== '' && v !== undefined && v !== null)
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
          .join('&');
      } else {
        query = `page=${params}`;
      }
      const res = await axios.get(
        process.env.REACT_APP_API_URL + `/api/movies${query ? '?' + query : ''}`
      );
      return { ...res.data, page: typeof params === 'object' ? params.page || 1 : params };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch movies');
    }
  }
);

// Async thunk to fetch a single movie by id
export const fetchMovieById = createAsyncThunk(
  'movies/fetchMovieById',
  async (id, { rejectWithValue }) => {
    try {
      const res = await axios.get(
        process.env.REACT_APP_API_URL + `/api/movies/${id}`
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch movie');
    }
  }
);

const movieSlice = createSlice({
  name: 'movies',
  initialState,
  reducers: {
    clearMovie(state) {
      state.movie = null;
    },
    resetMovies(state) {
      state.movies = [];
      state.page = 1;
      state.hasMore = true;
      state.total = 0;
    },
  },
  extraReducers: builder => {
    builder
      // Fetch movies (paginated)
      .addCase(fetchMovies.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMovies.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        const { results, page, pageSize, total } = action.payload;
        if (page === 1) {
          state.movies = results || [];
        } else {
          state.movies = [...state.movies, ...(results || [])];
        }
        state.page = page;
        state.pageSize = pageSize || 100;
        state.total = total || 0;
        state.hasMore = (page * (pageSize || 100)) < (total || 0);
      })
      .addCase(fetchMovies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch movies';
      })
      // Fetch single movie
      .addCase(fetchMovieById.pending, state => {
        state.loading = true;
        state.error = null;
        state.movie = null;
      })
      .addCase(fetchMovieById.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.movie = action.payload;
      })
      .addCase(fetchMovieById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch movie';
        state.movie = null;
      });
  },
});

export const { clearMovie, resetMovies } = movieSlice.actions;
export default movieSlice.reducer;
