// server/routes/tmdb.js
const express = require('express');
const router = express.Router();
const { pool } = require('../src/db');

// TMDB config
const API = 'https://api.themoviedb.org/3';
const KEY = process.env.TMDB_API_KEY || '';

// helpers
const qs = (o) =>
  new URLSearchParams({ api_key: KEY, include_adult: 'false', ...o }).toString();
const bad = (res, code, message, status = 400, extra = {}) =>
  res.status(status).json({ error: code, message, ...extra });

async function j(url) {
  const r = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error(`TMDB_${r.status}`);
  return r.json();
}
async function getMoviePack(id, lang) {
  // videos + release_dates (độ tuổi) + external_ids (imdb_id)
  return j(
    `${API}/movie/${id}?${qs({
      language: lang,
      append_to_response: 'videos,release_dates,external_ids',
    })}`
  );
}
function pickTrailer(results = []) {
  const ys = results.filter((v) => v.site === 'YouTube');
  return (
    ys.find((v) => v.type === 'Trailer' && v.official) ||
    ys.find((v) => v.type === 'Trailer') ||
    ys[0] ||
    null
  );
}
function pickCert(buckets = []) {
  const by = (code) => buckets.find((b) => b.iso_3166_1 === code);
  const cert = (b) =>
    b?.release_dates?.find((x) => (x.certification || '').trim())?.certification || null;
  return cert(by('VN')) || cert(by('US')) || cert(buckets[0]) || null;
}
// DB enum chỉ cho phép: Trailer | Teaser | Clip
function mapVideoKind(t) {
  const s = String(t || '').toUpperCase();
  if (s === 'TRAILER') return 'Trailer';
  if (s === 'TEASER') return 'Teaser';
  return 'Clip';
}

// ========== SEARCH ==========
router.get('/tmdb/search', async (req, res) => {
  try {
    if (!KEY) return bad(res, 'TMDB_KEY', 'Thiếu TMDB_API_KEY', 500);
    const query = String(req.query.query || '').trim();
    if (!query) return res.json({ items: [] });
    const page = Math.max(1, Number(req.query.page || 1));

    const data = await j(`${API}/search/movie?${qs({ query, page, language: 'vi-VN' })}`);
    const items = (data.results || []).map((m) => ({
      tmdbId: m.id,
      title: m.title,
      releaseDate: m.release_date || null,
      posterPath: m.poster_path || null,
      backdropPath: m.backdrop_path || null,
      overview: m.overview || null,
      voteAverage: m.vote_average ?? null,
      voteCount: m.vote_count ?? null,
    }));
    res.json({ items });
  } catch (e) {
    bad(res, 'TMDB_BAD_GATEWAY', String(e.message || e), 502);
  }
});

// ========== LIST CATALOG (now_playing | popular | top_rated | upcoming) ==========
router.get('/tmdb/list', async (req, res) => {
  try {
    if (!KEY) return bad(res, 'TMDB_KEY', 'Thiếu TMDB_API_KEY', 500);
    const cat = String(req.query.cat || 'now_playing').toLowerCase();
    const page = Math.max(1, Number(req.query.page || 1));
    const allow = new Set(['now_playing', 'popular', 'top_rated', 'upcoming']);
    const use = allow.has(cat) ? cat : 'now_playing';

    const data = await j(`${API}/movie/${use}?${qs({ language: 'vi-VN', page })}`);
    const items = (data.results || []).map((m) => ({
      tmdbId: m.id,
      title: m.title,
      releaseDate: m.release_date || null,
      posterPath: m.poster_path || null,
      backdropPath: m.backdrop_path || null,
      overview: m.overview || null,
      voteAverage: m.vote_average ?? null,
      voteCount: m.vote_count ?? null,
    }));
    res.json({ page: data.page || page, totalPages: data.total_pages || 1, items });
  } catch (e) {
    bad(res, 'TMDB_BAD_GATEWAY', String(e.message || e), 502);
  }
});

// ========== DETAIL (fallback vi-VN -> en-US) ==========
router.get('/tmdb/movie/:id', async (req, res) => {
  try {
    if (!KEY) return bad(res, 'TMDB_KEY', 'Thiếu TMDB_API_KEY', 500);
    const id = Number(req.params.id || 0);
    if (!id) return bad(res, 'BAD_REQUEST', 'tmdbId không hợp lệ');

    const vi = await getMoviePack(id, 'vi-VN');
    const en = await getMoviePack(id, 'en-US').catch(() => null);

    const title = (vi.title && vi.title.trim()) ? vi.title : en?.title || vi.title;
    const overview = (vi.overview && vi.overview.trim()) ? vi.overview : en?.overview || null;
    const runtime = vi.runtime || en?.runtime || 0;
    const releaseDate = vi.release_date || en?.release_date || null;
    const posterPath = vi.poster_path || en?.poster_path || null;
    const backdropPath = vi.backdrop_path || en?.backdrop_path || null;
    const voteAverage = vi.vote_average ?? en?.vote_average ?? null;
    const voteCount = vi.vote_count ?? en?.vote_count ?? null;
    const popularity = vi.popularity ?? en?.popularity ?? null;
    const imdbId = vi.external_ids?.imdb_id || en?.external_ids?.imdb_id || null;
    const originalTitle = vi.original_title || en?.original_title || null;
    const originalLanguage = vi.original_language || en?.original_language || null;
    const genresArr = (vi.genres?.length ? vi.genres : en?.genres || []).map((g) => g.name);
    const videosAll = (vi.videos?.results || []).concat(en?.videos?.results || []);
    const trailer = pickTrailer(videosAll);
    const ratingAge = pickCert(
      (vi.release_dates?.results || []).concat(en?.release_dates?.results || [])
    );

    res.json({
      tmdbId: vi.id,
      title,
      overview,
      runtime,
      releaseDate,
      posterPath,
      backdropPath,
      voteAverage,
      voteCount,
      popularity,
      imdbId,
      originalTitle,
      originalLanguage,
      genres: genresArr,
      ratingAge: ratingAge || null,
      trailer: trailer
        ? { site: trailer.site, key: trailer.key, url: `https://www.youtube.com/watch?v=${trailer.key}` }
        : null,
    });
  } catch {
    bad(res, 'NOT_FOUND', 'Không tìm thấy trên TMDB', 404);
  }
});

// ========== IMPORT (upsert + videos, genres JSON) ==========
router.post('/tmdb/import/:id', async (req, res) => {
  if (!KEY) return bad(res, 'TMDB_KEY', 'Thiếu TMDB_API_KEY', 500);
  const tmdbId = Number(req.params.id || 0);
  if (!tmdbId) return bad(res, 'BAD_REQUEST', 'tmdbId không hợp lệ');

  const conn = await pool.getConnection();
  try {
    const vi = await getMoviePack(tmdbId, 'vi-VN');
    const en = await getMoviePack(tmdbId, 'en-US').catch(() => null);

    const title = (vi.title && vi.title.trim()) ? vi.title : en?.title || vi.title;
    const overview = (vi.overview && vi.overview.trim()) ? vi.overview : en?.overview || null;
    const runtime = vi.runtime || en?.runtime || 0;
    const releaseDate = vi.release_date || en?.release_date || null;
    const posterPath = vi.poster_path || en?.poster_path || null;
    const backdropPath = vi.backdrop_path || en?.backdrop_path || null;
    const voteAverage = vi.vote_average ?? en?.vote_average ?? null;
    const voteCount = vi.vote_count ?? en?.vote_count ?? null;
    const popularity = vi.popularity ?? en?.popularity ?? null;
    const imdbId = vi.external_ids?.imdb_id || en?.external_ids?.imdb_id || null;
    const originalTitle = vi.original_title || en?.original_title || null;
    const originalLanguage = vi.original_language || en?.original_language || null;
    const genresArr = (vi.genres?.length ? vi.genres : en?.genres || []).map((g) => g.name);
    const genresJson = genresArr.length ? JSON.stringify(genresArr) : null;

    const videosAll = (vi.videos?.results || []).concat(en?.videos?.results || []);
    const trailer = pickTrailer(videosAll);
    const trailerUrl = trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null;
    const ratingAge = pickCert(
      (vi.release_dates?.results || []).concat(en?.release_dates?.results || [])
    );

    await conn.beginTransaction();

    // upsert movies
    await conn.query(
      `INSERT INTO movies
       (tmdb_id, title, status, duration_min, rating_age, genres, release_date, trailer_url, description,
        imdb_id, original_title, original_language, poster_path, backdrop_path, popularity, vote_average, vote_count,
        created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,UTC_TIMESTAMP(),UTC_TIMESTAMP())
       ON DUPLICATE KEY UPDATE
         title=VALUES(title),
         duration_min=VALUES(duration_min),
         rating_age=VALUES(rating_age),
         genres=VALUES(genres),
         release_date=VALUES(release_date),
         trailer_url=VALUES(trailer_url),
         description=VALUES(description),
         imdb_id=VALUES(imdb_id),
         original_title=VALUES(original_title),
         original_language=VALUES(original_language),
         poster_path=VALUES(poster_path),
         backdrop_path=VALUES(backdrop_path),
         popularity=VALUES(popularity),
         vote_average=VALUES(vote_average),
         vote_count=VALUES(vote_count),
         updated_at=UTC_TIMESTAMP()`,
      [
        tmdbId,
        title,
        'NOW',
        Number(runtime || 0),
        ratingAge || null,
        genresJson,
        releaseDate || null,
        trailerUrl,
        overview,
        imdbId,
        originalTitle,
        originalLanguage,
        posterPath,
        backdropPath,
        popularity,
        voteAverage,
        voteCount,
      ]
    );

    // id trong DB
    const [[row]] = await conn.query(`SELECT id FROM movies WHERE tmdb_id=?`, [tmdbId]);
    const movieId = Number(row.id);

    // videos: replace all, chỉ YouTube, map kind đúng ENUM
    await conn.query(`DELETE FROM movie_videos WHERE movie_id=?`, [movieId]);
    const ys = videosAll.filter((v) => v.site === 'YouTube');
    if (ys.length) {
      const values = ys.slice(0, 50).map((v) => [
        movieId,
        'YouTube',
        mapVideoKind(v.type),
        v.key,
        v.published_at ? new Date(v.published_at) : null,
      ]);
      await conn.query(
        `INSERT INTO movie_videos (movie_id, site, kind, key_or_url, published_at) VALUES ?`,
        [values]
      );
    }

    await conn.commit();
    res.json({ imported: true, movieId });
  } catch (e) {
    await conn.rollback();
    bad(res, 'INTERNAL', String(e.message || e), 500);
  } finally {
    conn.release();
  }
});

module.exports = router;
