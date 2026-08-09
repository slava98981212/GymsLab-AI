import React, { useState } from 'react';
import { Video, Camera, Trash2, AlertCircle, Play, Sparkles } from 'lucide-react';
import { validateVideoDuration, extractVideoFrames } from '../utils/videoUtils';

export default function VideoRecorder({ dailyLog, onUpdateLog }) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const videos = dailyLog?.videos || [];

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (videos.length >= 5) {
      alert('Maximum 5 exercise videos allowed per day.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Validate 20s max duration cap
      const validation = await validateVideoDuration(file);
      if (!validation.valid) {
        setErrorMsg(validation.error);
        setLoading(false);
        return;
      }

      // 2. Read as Base64/DataURL for local IndexedDB storage
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const videoDataUrl = evt.target.result;

        // 3. Extract 2 keyframe JPEG snapshots for AI Vision form analysis
        const keyframes = await extractVideoFrames(file);

        const newVideo = {
          id: `vid_${Date.now()}`,
          name: file.name || `Exercise Form Clip #${videos.length + 1}`,
          dataUrl: videoDataUrl,
          keyframes: keyframes,
          duration: Math.round(validation.duration),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const updatedVideos = [...videos, newVideo];
        onUpdateLog({ videos: updatedVideos });
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setErrorMsg('Error processing video file: ' + err.message);
      setLoading(false);
    }
  };

  const handleDeleteVideo = (id) => {
    const updated = videos.filter((v) => v.id !== id);
    onUpdateLog({ videos: updated });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1rem 0' }}>
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <span className="badge badge-cyan"><Video size={12} /> FORM VAULT</span>
            <h2 style={{ fontSize: '1.2rem', marginTop: '0.25rem' }}>Daily Exercise Videos</h2>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className={`badge ${videos.length >= 5 ? 'badge-amber' : 'badge-emerald'}`}>
              {videos.length} / 5 Videos
            </span>
          </div>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Record up to 5 short exercise clips per day (strictly capped at max 20 seconds). OpenAI GPT-4o Vision will analyze your form in your daily 23:00 summary!
        </p>

        {errorMsg && (
          <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: 'var(--accent-rose)', padding: '0.75rem 1rem', borderRadius: '12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <AlertCircle size={18} /> {errorMsg}
          </div>
        )}

        <label
          className="btn-primary"
          style={{ width: '100%', cursor: videos.length >= 5 || loading ? 'not-allowed' : 'pointer', opacity: videos.length >= 5 || loading ? 0.6 : 1 }}
        >
          {loading ? <Sparkles className="spin" size={18} /> : <Camera size={18} />}
          <span>{loading ? 'Processing Video & Extracting Frames...' : 'Record / Upload 20s Exercise Video'}</span>
          <input
            type="file"
            accept="video/*"
            capture="environment"
            onChange={handleVideoUpload}
            disabled={videos.length >= 5 || loading}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {/* Video Gallery List */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
          Saved Video Clips ({videos.length})
        </h3>

        {videos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            No form videos uploaded yet today. Tap <strong>Record / Upload</strong> above to log your squats, bench, or pull-ups!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
            {videos.map((vid, idx) => (
              <div
                key={vid.id}
                style={{
                  background: 'rgba(2, 6, 23, 0.6)',
                  border: '1px solid var(--border-card)',
                  borderRadius: '16px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Video size={16} color="var(--primary-cyan)" />
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Clip #{idx + 1} ({vid.duration}s)
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteVideo(vid.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* HTML5 Video Player */}
                <video
                  src={vid.dataUrl}
                  controls
                  playsInline
                  style={{ width: '100%', maxHeight: '220px', borderRadius: '12px', background: '#000' }}
                />

                {/* Keyframes Preview for AI Vision */}
                {vid.keyframes && vid.keyframes.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '0.35rem' }}>
                      AI Vision Keyframe Extracts ({vid.keyframes.length} frames):
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {vid.keyframes.map((frame, fIdx) => (
                        <img
                          key={fIdx}
                          src={frame}
                          alt="Form frame"
                          style={{ width: '80px', height: '45px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--border-card)' }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
