// src/pages/AboutUs.jsx
import { useEffect, useState } from 'react';
import api from '../config/axios';
import { toast } from 'react-toastify';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const FOKO_API_TOKEN = 'Bearer GgFdzkPLh9NiFTHKMYkUbFsefWRACNPHKNnOrHCdEdUy0sAZXQiBF74A22BW';

export default function AboutUs() {
  const [aboutData, setAboutData] = useState({
    text: '',
    background_image: '', // may hold URL string from API
    background_image_file: null, // File object selected from input
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAboutData();
  }, []);

  const fetchAboutData = async () => {
    try {
      const response = await api.get('/about');
      setAboutData({
        text: response.data?.text ?? '',
        background_image: response.data?.background_image ?? '',
        background_image_file: null,
      });
    } catch (error) {
      toast.error('Failed to fetch about data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    const formData = new FormData();
    formData.append('text', aboutData.text || '');
    // Only append background_image if a new file was selected
    if (aboutData.background_image_file instanceof File) {
      formData.append('background_image', aboutData.background_image_file);
    }
    try {
      await api.post('/about', formData, {
        headers: {
          Authorization: FOKO_API_TOKEN,
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('About us updated successfully');
      // Optionally refetch to refresh any URLs from server
      fetchAboutData();
    } catch (error) {
      toast.error('Failed to update about us');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">About Us</h1>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Background Image
            </label>
            <div className="mt-1">
              <input
                type="file"
                accept="image/*"
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-md cursor-pointer focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                onChange={(e) => {
                  const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
                  setAboutData((prev) => ({ ...prev, background_image_file: file }));
                }}
              />
              {aboutData.background_image && (
                <p className="text-xs text-gray-500 mt-2">
                  Current image URL: {aboutData.background_image}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Content
            </label>
            <div className="mt-1">
              <ReactQuill
                value={aboutData.text}
                onChange={(content) => setAboutData({ ...aboutData, text: content })}
                modules={{
                  toolbar: [
                    [{ header: [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    [{ align: [] }],
                    ['link', 'image'],
                    ['clean']
                  ],
                }}
                formats={[
                  'header',
                  'bold', 'italic', 'underline', 'strike',
                  'list', 'bullet',
                  'align',
                  'link', 'image',
                  'clean'
                ]}
                style={{ height: 500 }}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleUpdate}
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Save (multipart/form-data)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}