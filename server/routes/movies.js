// server/routes/movies.js
const express = require('express');
const router = express.Router();
const { pool } = require('../src/db');

const TMDB_IMG_W500 = 'https://image.tmdb.org/t/p/w500';

function bad(res, code, message, status = 400, extra = {}) {
  return res.status(status).json({ error: code, message, ...extra });
}
const normDate = (d) => {
  if (!d) return null;
  const s = String(d).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
};
function mapMovieRow(r) {
  return {
    id: Number(r.id),
    tmdbId: r.tmdb_id ?? null,
    title: r.title,
    status: r.status,
    durationMin: r.duration_min != null ? Number(r.duration_min) : 0,
    ratingAge: r.rating_age || null,
    genres: r.genres || null,
    releaseDate: r.release_date ? new Date(r.release_date).toISOString().slice(0, 10) : null,
    trailerUrl: r.trailer_url || null,
    description: r.description || null,
    imdbId: r.imdb_id || null,
    originalTitle: r.original_title || null,
    originalLanguage: r.original_language || null,
    posterPath: r.poster_path || null,
    backdropPath: r.backdrop_path || null,
    popularity: r.popularity != null ? Number(r.popularity) : null,
    voteAverage: r.vote_average != null ? Number(r.vote_average) : null,
    voteCount: r.vote_count != null ? Number(r.vote_count) : null,
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : null,
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : null,
    posterUrl: r.poster_path ? `${TMDB_IMG_W500}${r.poster_path}` : null,
    backdropUrl: r.backdrop_path ? `${TMDB_IMG_W500}${r.backdrop_path}` : null,
  };
}

// LIST
router.get('/movies', async (req, res) => {
  const q = String(req.query.search || '').trim();
  const page = Math.max(1, Number(req.query.page || 1));
  const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize || 12)));
  const fields = String(req.query.fields || 'minimal').toLowerCase();

  const where = q ? `WHERE title LIKE ?` : '';
  const params = q ? [`%${q}%`] : [];

  const [[{ total }]] = await pool.query(`SELECT COUNT(*) total FROM movies ${where}`, params);

  const selectMinimal = `id, title, duration_min, poster_path`;
  const selectAll = `id, tmdb_id, title, status, duration_min, rating_age, genres, release_date, trailer_url, description,
                     imdb_id, original_title, original_language, poster_path, backdrop_path, popularity, vote_average, vote_count,
                     created_at, updated_at`;

  const [rows] = await pool.query(
    `SELECT ${fields === 'all' ? selectAll : selectMinimal} FROM movies ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
    q ? [...params, pageSize, (page - 1) * pageSize] : [pageSize, (page - 1) * pageSize]
  );

  res.json({
    page, pageSize, total,
    items: rows.map(r => (fields === 'all'
      ? mapMovieRow(r)
      : ({
          id: Number(r.id),
          title: r.title,
          durationMin: Number(r.duration_min || 0),
          posterUrl: r.poster_path ? `${TMDB_IMG_W500}${r.poster_path}` : null
        })))
  });
});

// DETAIL (full)
router.get('/movies/:id', async (req, res) => {
  const id = Number(req.params.id);
  const [[m]] = await pool.query(
    `SELECT id, tmdb_id, title, status, duration_min, rating_age, genres, release_date, trailer_url, description,
            imdb_id, original_title, original_language, poster_path, backdrop_path, popularity, vote_average, vote_count,
            created_at, updated_at
       FROM movies WHERE id = ?`, [id]
  );
  if (!m) return bad(res, 'NOT_FOUND', 'Không có phim', 404);

  const [videos] = await pool.query(
    `SELECT site, kind, key_or_url, published_at FROM movie_videos WHERE movie_id=? ORDER BY published_at DESC, id DESC`,
    [id]
  );

  const dto = mapMovieRow(m);
  dto.videos = videos.map(v => ({
    site: v.site, kind: v.kind, key: v.key_or_url,
    publishedAt: v.published_at ? new Date(v.published_at).toISOString() : null
  }));

  res.json(dto);
});

// CREATE
router.post('/movies', async (req, res) => {
  try {
    const b = req.body || {};
    const title = String(b.title || '').trim();
    const status = ['NOW', 'SOON'].includes(b.status) ? b.status : 'NOW';
    const duration = Math.max(0, Number(b.durationMin || 0));
    if (!title || !duration) return bad(res, 'BAD_REQUEST', 'title và durationMin là bắt buộc');

    const [r] = await pool.query(
      `INSERT INTO movies
       (tmdb_id, title, status, duration_min, rating_age, genres, release_date, trailer_url, description,
        imdb_id, original_title, original_language, poster_path, backdrop_path, popularity, vote_average, vote_count,
        created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,UTC_TIMESTAMP(),UTC_TIMESTAMP())`,
      [
        b.tmdbId || null, title, status, duration, b.ratingAge || null, b.genres || null,
        normDate(b.releaseDate), b.trailerUrl || null, b.description || null,
        b.imdbId || null, b.originalTitle || null, b.originalLanguage || null,
        b.posterPath || null, b.backdropPath || null,
        b.popularity ?? null, b.voteAverage ?? null, b.voteCount ?? null
      ]
    );
    const [[row]] = await pool.query(`SELECT * FROM movies WHERE id=?`, [r.insertId]);
    res.json(mapMovieRow(row));
  } catch (e) {
    return bad(res, 'INTERNAL', e.message, 500);
  }
});

// UPDATE
router.put('/movies/:id', async (req, res) => {
  const id = Number(req.params.id);
  const b = req.body || {};
  const [[exists]] = await pool.query(`SELECT id FROM movies WHERE id=?`, [id]);
  if (!exists) return bad(res, 'NOT_FOUND', 'Không có phim', 404);

  const fields = [];
  const vals = [];
  const set = (col, val) => { fields.push(`${col}=?`); vals.push(val); };

  if (b.tmdbId !== undefined) set('tmdb_id', b.tmdbId || null);
  if (b.title !== undefined) set('title', String(b.title).trim());
  if (b.status !== undefined) set('status', ['NOW','SOON'].includes(b.status)?b.status:'NOW');
  if (b.durationMin !== undefined) set('duration_min', Math.max(0, Number(b.durationMin || 0)));
  if (b.ratingAge !== undefined) set('rating_age', b.ratingAge || null);
  if (b.genres !== undefined) set('genres', b.genres || null);
  if (b.releaseDate !== undefined) set('release_date', normDate(b.releaseDate));
  if (b.trailerUrl !== undefined) set('trailer_url', b.trailerUrl || null);
  if (b.description !== undefined) set('description', b.description || null);
  if (b.imdbId !== undefined) set('imdb_id', b.imdbId || null);
  if (b.originalTitle !== undefined) set('original_title', b.originalTitle || null);
  if (b.originalLanguage !== undefined) set('original_language', b.originalLanguage || null);
  if (b.posterPath !== undefined) set('poster_path', b.posterPath || null);
  if (b.backdropPath !== undefined) set('backdrop_path', b.backdropPath || null);
  if (b.popularity !== undefined) set('popularity', b.popularity ?? null);
  if (b.voteAverage !== undefined) set('vote_average', b.voteAverage ?? null);
  if (b.voteCount !== undefined) set('vote_count', b.voteCount ?? null);

  if (!fields.length) return bad(res, 'BAD_REQUEST', 'Không có trường để cập nhật');
  fields.push('updated_at=UTC_TIMESTAMP()');

  await pool.query(`UPDATE movies SET ${fields.join(', ')} WHERE id=?`, [...vals, id]);

  const [[row]] = await pool.query(`SELECT * FROM movies WHERE id=?`, [id]);
  res.json(mapMovieRow(row));
});

// DELETE
router.delete('/movies/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    const [r] = await pool.query(`DELETE FROM movies WHERE id=?`, [id]);
    if (r.affectedRows === 0) return bad(res, 'NOT_FOUND', 'Không có phim', 404);
    res.json({ deleted: true });
  } catch (e) {
    if (e && (e.code === 'ER_ROW_IS_REFERENCED_2' || e.errno === 1451)) {
      return bad(res, 'MOVIE_IN_USE', 'Không thể xóa vì đang được dùng', 409);
    }
    return bad(res, 'INTERNAL', e.message, 500);
  }
});

module.exports = router;
