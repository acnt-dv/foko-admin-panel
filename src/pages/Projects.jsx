// src/pages/Projects.jsx
import {useState, useEffect} from 'react';
import api from '../config/axios';
import {toast} from 'react-toastify';

export default function Projects() {
    const [projects, setProjects] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [currentProject, setCurrentProject] = useState(null);
    const [formData, setFormData] = useState(null);
    const [galleryFormData, setGalleryFormData] = useState(null);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await api.get('/projects');
            setProjects(response.data);
        } catch (error) {
            toast.error('Failed to fetch projects');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const formDataToSend = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                if (key === "image") {
                    formDataToSend.append(key, value?.file, value?.name);
                } else {
                    formDataToSend.append(key, value);
                }
            });


            if (currentProject) {
                await api.put(`/projects/${currentProject.id}`, formDataToSend);
                toast.success('Project updated successfully');
            } else {
                const response = await api.post('/projects', formDataToSend);
                if (response?.data?.id) {
                    await Promise.all(
                        galleryFormData?.images?.map(item => {
                            const dataToSend = new FormData();
                            dataToSend.append("image", item?.file, item?.name);
                            api.post(`/projects/${response?.data?.id}/gallery`, dataToSend);
                        })
                    );
                }
                toast.success('Project created successfully');
            }
            setModalOpen(false);
            fetchProjects();
        } catch (error) {
            toast.error('Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this project?')) {
            try {
                await api.delete(`/projects/${id}`);
                toast.success('Project deleted successfully');
                fetchProjects();
            } catch (error) {
                toast.error('Failed to delete project');
            }
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();

            reader.onloadend = () => {
                const binaryData = reader.result; // Binary data as ArrayBuffer

                // Convert binary to Blob
                const blob = new Blob([binaryData], {type: file.type});

                // Update form data state with binary data
                setFormData((prevFormData) => ({
                    ...prevFormData,
                    image: {
                        file: blob,
                        name: file?.name || "uploaded-image.png",
                    }, // Store binary instead of file object
                }));
            };

            reader.readAsArrayBuffer(file); // Convert file to binary
        }
    };

    const handleGalleryUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        const readFiles = files.map(file => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();

                reader.onloadend = () => {
                    const binaryData = reader.result;
                    const blob = new Blob([binaryData], {type: file.type});

                    resolve({
                        file: blob,
                        name: file.name || "uploaded-image.png",
                    });
                };

                reader.onerror = reject;
                reader.readAsArrayBuffer(file);
            });
        });

        try {
            const images = await Promise.all(readFiles);
            setGalleryFormData(prev => ({
                ...prev,
                images, // array of image objects
            }));
        } catch (err) {
            console.error("Error reading files:", err);
        }
    };


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
                <button
                    onClick={() => {
                        setCurrentProject(null);
                        setFormData({
                            title: '',
                            description: '',
                            image: '',
                            // cover_image: '',
                            // category: ''
                        });
                        setModalOpen(true);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                    Add New Project
                </button>
            </div>

            {/* Projects Table */}
            <div className="flex flex-col">
                <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                        <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Title
                                    </th>
                                    <th scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                {projects.map((project) => (
                                    <tr key={project.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{project.title}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">{project?.category}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => {
                                                    setCurrentProject(project);
                                                    setFormData(project);
                                                    setModalOpen(true);
                                                }}
                                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(project.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Form */}
            {modalOpen && (
                <div className="fixed z-10 inset-0 overflow-y-auto">
                    <div
                        className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>

                        <div
                            className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <form onSubmit={handleSubmit} className="p-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Title</label>
                                        <input
                                            type="text"
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            value={formData.title}
                                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Description</label>
                                        <textarea
                                            required
                                            rows="3"
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            value={formData.description}
                                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Category</label>
                                        <input
                                            type="text"
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            value={formData.category}
                                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Cover Image
                                            URL</label>
                                        <input
                                            type="file"
                                            required
                                            // className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            className="mt-1 block w-full"
                                            value={formData.cover_image}
                                            // onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                                            onChange={handleImageUpload}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Gallery
                                            Images</label>
                                        <input
                                            type="file"
                                            required
                                            multiple
                                            accept="image/*"
                                            onChange={handleGalleryUpload}
                                            // onChange={handleImage}
                                            className="mt-1 block w-full"
                                        />
                                        {/* <div className="mt-2 grid grid-cols-3 gap-2">
                      {formData?.images?.map((image, index) => (
                        <div key={index} className="relative">
                          <img src={image} alt="" className="h-20 w-20 object-cover rounded" />
                          <button
                            type="button"
                            onClick={() => setFormData({
                              ...formData,
                              images: formData?.images?.filter((_, i) => i !== index)
                            })}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div> */}
                                    </div>
                                </div>

                                <div className="mt-5 sm:mt-6 flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setModalOpen(false)}
                                        className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                                    >
                                        {currentProject ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}