import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { GalleryImage } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Gallery: React.FC = () => {
  const { user } = useAuth();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addFile, setAddFile] = useState<File | null>(null);
  const [addTitle, setAddTitle] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    setLoading(true);
    setError('');
    try {
      const imgs = await api.getGalleryImages();
      setImages(imgs);
    } catch (e) {
      setError('Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFile || !addTitle) return;
    setAddLoading(true);
    setAddError('');
    try {
      await api.addGalleryImage(addFile, addTitle);
      setShowAdd(false);
      setAddFile(null);
      setAddTitle('');
      fetchImages();
    } catch (e) {
      setAddError('Failed to add image');
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteImage = async (id: number) => {
    if (!window.confirm('Delete this image?')) return;
    try {
      await api.deleteGalleryImage(id);
      setImages((imgs) => imgs.filter((img) => img.id !== id));
    } catch (e) {
      alert('Failed to delete image');
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-16 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Gallery</h1>
      {user && user.role === 'admin' && (
        <div className="flex justify-end mb-6">
          <button
            className="px-6 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition shadow"
            onClick={() => setShowAdd((v) => !v)}
          >
            Add Image
          </button>
        </div>
      )}
      {showAdd && user && user.role === 'admin' && (
        <form className="mb-8 bg-gray-50 p-6 rounded-xl shadow flex flex-col md:flex-row gap-4 items-center" onSubmit={handleAddImage}>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setAddFile(e.target.files?.[0] || null)}
            className="border rounded px-3 py-2"
            required
          />
          <input
            type="text"
            placeholder="Image title"
            value={addTitle}
            onChange={(e) => setAddTitle(e.target.value)}
            className="border rounded px-3 py-2"
            required
          />
          <button
            type="submit"
            className="px-6 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700 transition"
            disabled={addLoading}
          >
            {addLoading ? 'Adding...' : 'Add'}
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded bg-gray-300 text-gray-700 hover:bg-gray-400 transition"
            onClick={() => setShowAdd(false)}
            disabled={addLoading}
          >
            Cancel
          </button>
          {addError && <div className="text-red-500 text-sm ml-4">{addError}</div>}
        </form>
      )}
      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : error ? (
        <div className="text-center text-red-500">{error}</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {images.map((image) => (
            <div key={image.id} className="relative bg-gray-200 aspect-w-1 aspect-h-1 rounded-lg overflow-hidden group">
              <img src={`${API_URL}${image.src}`} alt={image.title} className="object-cover w-full h-full" />
              {user && user.role === 'admin' && (
                <button
                  className="absolute top-2 right-2 bg-white bg-opacity-80 rounded-full p-2 shadow hover:bg-red-100 transition group-hover:opacity-100 opacity-80"
                  onClick={() => handleDeleteImage(image.id)}
                  title="Delete Image"
                >
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                {image.title}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Gallery; 