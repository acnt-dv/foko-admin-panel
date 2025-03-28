// src/pages/AboutUs.jsx
import { useEffect, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import api from '../config/axios';
import { toast } from 'react-toastify';

export default function AboutUs() {
  const [aboutData, setAboutData] = useState({
    text: '',
    background_image: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAboutData();
  }, []);

  const fetchAboutData = async () => {
    try {
      const response = await api.get('/about');
      setAboutData(response.data);
    } catch (error) {
      toast.error('Failed to fetch about data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      await api.put('/about', aboutData);
      toast.success('About us updated successfully');
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
              Background Image URL
            </label>
            <input
              type="text"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={aboutData.background_image}
              onChange={(e) => setAboutData({ ...aboutData, background_image: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Content
            </label>
            <div className="mt-1">
              <Editor
                apiKey="your-tinymce-api-key"
                value={aboutData.text}
                init={{
                  height: 500,
                  menubar: true,
                  plugins: [
                    'advlist autolink lists link image charmap print preview anchor',
                    'searchreplace visualblocks code fullscreen',
                    'insertdatetime media table paste code help wordcount'
                  ],
                  toolbar: 'undo redo | formatselect | bold italic backcolor | \
                    alignleft aligncenter alignright alignjustify | \
                    bullist numlist outdent indent | removeformat | help'
                }}
                onEditorChange={(content) => setAboutData({ ...aboutData, text: content })}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleUpdate}
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}