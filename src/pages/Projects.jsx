// src/pages/Projects.jsx
import {useEffect, useState} from 'react';
import api from '../config/axios';
import {toast} from 'react-toastify';
import GalleryPreview from "../components/GalleryPreview.jsx";
import RichTextEditor from '../utils/RichTextEditor.jsx';

export default function Projects() {
    const [projects, setProjects] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [currentProject, setCurrentProject] = useState(null);
    const [formData, setFormData] = useState(null);
    const [galleryFormData, setGalleryFormData] = useState(null);
    const [projectData, setProjectData] = useState([{id: '', key: '', value: ''}]);

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
            Object.entries(formData || {}).forEach(([key, value]) => {
                if (key === 'image' && value && value.file) {
                    formDataToSend.append('image', value.file, value.name || 'uploaded-image.png');
                } else if (key === 'tags') {
                    const tagsArray = Array.isArray(value) ? value : (value ? [value] : []);
                    formDataToSend.append('tags[]', tagsArray);
                } else if (value !== undefined && value !== null) {
                    formDataToSend.append(key, value);
                }
            });
            console.debug([...formDataToSend.entries()]);
            if (currentProject) {
                await api.post(`/projects/${currentProject.id}`, formDataToSend);
                const originalData = currentProject.project_data || [];

                await Promise.all(
                    (projectData || [])
                        .filter((item) => {
                            if (!item.key || !item.key.trim()) return false;
                            const original = originalData.find(o => o.id === item.id);
                            // فقط وقتی ارسال کن که آیتم جدید باشه یا مقدار تغییر کرده باشه
                            return !original || original.value !== item.value || original.key !== item.key;
                        })
                        .map((item) => {
                            if (item.id) {
                                // اگر id داره یعنی آپدیت (PUT)
                                return api.post(`/projects/${currentProject.id}/data/${item.id}`, {
                                    key: item.key,
                                    value: item.value ?? ''
                                });
                            } else {
                                // اگر id نداره یعنی آیتم جدید (POST)
                                return api.post(`/projects/${currentProject.id}/data`, {
                                    key: item.key,
                                    value: item.value ?? ''
                                });
                            }
                        })
                );
                toast.success('Project updated successfully');
            } else {
                const response = await api.post('/projects', formDataToSend);
                if (response?.data?.id) {
                    const galleryResults = await Promise.allSettled(
                        (galleryFormData?.images || []).map((item) => {
                            const dataToSend = new FormData();
                            dataToSend.append("image", item.file, item.name || "uploaded-image.png");
                            return api.post(`/projects/${response.data.id}/gallery`, dataToSend);
                        })
                    );
                    const failedUploads = galleryResults.filter(r => r.status === 'rejected').length;
                    if (failedUploads > 0) {
                        toast.warn(`${failedUploads} image${failedUploads > 1 ? 's' : ''} failed to upload. The rest were uploaded successfully.`);
                    }
                    await Promise.all(
                        (projectData || [])
                            .filter((item) => item && item.key && item.key.trim() !== '')
                            .map((item) => api.post(`/projects/${response.data.id}/data`, {
                                key: item.key,
                                value: item.value ?? ''
                            }))
                    );
                }
                toast.success('Project created successfully');
            }
            setProjectData([{key: '', value: ''}]);
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

    const handleImageUpload = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        setFormData((prev) => ({
            ...prev,
            image: {
                file,
                name: file.name || "uploaded-image.png",
            },
        }));
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
                images,
            }));
        } catch (err) {
            console.error("Error reading files:", err);
        }
    };

    const handleKVChange = (index, field, newValue) => {
        setProjectData((prev) => {
            const copy = [...prev];
            copy[index] = {...copy[index], [field]: newValue};
            return copy;
        });
    };

    const addKVRow = () => setProjectData((prev) => [...prev, {key: '', value: ''}]);

    const removeKVRow = async (index, id) => {
        const itemToRemove = projectData[index];

        if (currentProject && itemToRemove?.key) {
            try {
                await api.delete(`/projects/${currentProject.id}/data/${id}`);
                toast.success('Project data deleted successfully');
            } catch (error) {
                toast.error('Failed to delete project data');
                console.error(error);
            }
        }

        setProjectData((prev) => prev.filter((_, i) => i !== index));
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
                            tags: [],
                        });
                        setProjectData([{key: '', value: ''}]);
                        setGalleryFormData(null);
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
                                        Tags
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
                                            <div className="text-sm text-gray-500">
                                                {Array.isArray(project?.tags) && project.tags.length > 0
                                                    ? project.tags.join(', ')
                                                    : (project?.category || '')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => {
                                                    setCurrentProject(project);
                                                    setFormData(() => {
                                                        const normalizedTags = Array.isArray(project?.tags)
                                                            ? project.tags
                                                            : (project?.category ? [project.category] : []);
                                                        return {
                                                            title: project.title || '',
                                                            description: project.description || '',
                                                            image: project.image || '',
                                                            tags: normalizedTags
                                                        };
                                                    });
                                                    setProjectData(
                                                        Array.isArray(project.project_data) && project.project_data.length
                                                            ? project.project_data.map(({id, key, value}) => ({
                                                                id,
                                                                key,
                                                                value
                                                            }))
                                                            : [{key: '', value: ''}]
                                                    );
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

                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700">Description</label>
                                        <div className="mt-1">
                                            <RichTextEditor
                                                value={formData.description}
                                                onChange={(content) => setFormData({...formData, description: content})}
                                                placeholder="Write the project description here…"

                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Tag</label>
                                        <select
                                            required
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            value={(Array.isArray(formData?.tags) && formData.tags[0]) || ''}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                tags: e.target.value ? [e.target.value] : []
                                            })}
                                        >
                                            <option value="" disabled>Choose a tag</option>
                                            <option value="RESIDENTIAL">RESIDENTIAL</option>
                                            <option value="COMMERCIAL">COMMERCIAL</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Cover Image</label>
                                        <input
                                            type="file"
                                            required={!currentProject}
                                            className="mt-1 block w-full"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                        />
                                    </div>

                                    <div>
                                        <h3 className="mt-2 mb-1 text-sm font-semibold text-gray-900 border-t pt-3">Project
                                            Custom Data</h3>
                                        <label className="block text-sm font-medium text-gray-700">Custom Data (Key /
                                            Value)</label>
                                        <div className="mt-2 space-y-2">
                                            {projectData.map((row, idx) => (
                                                <div key={idx} className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Key"
                                                        className="block w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                        value={row.key}
                                                        onChange={(e) => handleKVChange(idx, 'key', e.target.value)}
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Value"
                                                        className="block w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                        value={row.value}
                                                        onChange={(e) => handleKVChange(idx, 'value', e.target.value)}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeKVRow(idx, row.id)}
                                                        className="text-red-600 hover:text-red-800 text-sm"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={addKVRow}
                                                className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md shadow-sm text-sm bg-white hover:bg-gray-50"
                                            >
                                                + Add Row
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Gallery
                                            Images</label>
                                        <input
                                            type="file"
                                            required={!currentProject}
                                            multiple
                                            accept="image/*"
                                            onChange={handleGalleryUpload}
                                            className="mt-1 block w-full"
                                        />
                                        <div className="mt-2">
                                            <GalleryPreview galleryFormData={galleryFormData}
                                                            setGalleryFormData={setGalleryFormData}
                                                            currentProject={currentProject}/>
                                        </div>
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