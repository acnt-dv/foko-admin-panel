// src/pages/Projects.jsx

import {useEffect, useState} from 'react';
import api from '../config/axios';
import {toast} from 'react-toastify';
import ProjectModal from "../components/ProjectModal.jsx";

export default function Projects() {
    const [projects, setProjects] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [currentProject, setCurrentProject] = useState(null);
    const [formData, setFormData] = useState(null);
    const [galleryFormData, setGalleryFormData] = useState(null);
    const [projectData, setProjectData] = useState([{id: '', key: '', value: ''}]);
    const [imageDirty, setImageDirty] = useState(false);
    const [galleryDirty, setGalleryDirty] = useState(false);

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
                if (key === 'image') {
                    // Only send image if user actually changed it
                    if (imageDirty && value && value.file) {
                        formDataToSend.append('image', value.file, value.name || 'uploaded-image.png');
                    }
                } else if (key === 'tags') {
                    const tagsArray = Array.isArray(value) ? value : (value ? [value] : []);
                    // append each tag individually to avoid array being stringifies
                    tagsArray.forEach(t => formDataToSend.append('tags[]', t));
                } else if (value !== undefined && value !== null) {
                    formDataToSend.append(key, value);
                }
            });

            console.debug([...formDataToSend.entries()]);

            if (currentProject) {
                // Update main project fields (without unchanged image)
                await api.post(`/projects/${currentProject.id}`, formDataToSend);

                const originalData = currentProject.project_data || [];

                // Upsert changed custom data only
                await Promise.all(
                    (projectData || [])
                        .filter((item) => {
                            if (!item.key || !item.key.trim()) return false;
                            const original = originalData.find(o => o.id === item.id);
                            return !original || original.value !== item.value || original.key !== item.key;
                        })
                        .map((item) => {
                            if (item.id) {
                                return api.post(`/projects/${currentProject.id}/data/${item.id}`, {
                                    key: item.key,
                                    value: item.value ?? ''
                                });
                            } else {
                                return api.post(`/projects/${currentProject.id}/data`, {
                                    key: item.key,
                                    value: item.value ?? ''
                                });
                            }
                        })
                );

                // Upload new gallery images only if user changed them in update mode
                if (galleryDirty && galleryFormData?.images?.length) {
                    const galleryResults = await Promise.allSettled(
                        galleryFormData.images.map((item) => {
                            const dataToSend = new FormData();
                            dataToSend.append('image', item.file, item.name || 'uploaded-image.png');
                            return api.post(`/projects/${currentProject.id}/gallery`, dataToSend);
                        })
                    );
                    const failedUploads = galleryResults.filter(r => r.status === 'rejected').length;
                    if (failedUploads > 0) {
                        toast.warn(`${failedUploads} image${failedUploads > 1 ? 's' : ''} failed to upload. The rest were uploaded successfully.`);
                    }
                }

                toast.success('Project updated successfully');
            } else {
                // Create mode (always send selected image/gallery if provided)
                const response = await api.post('/projects', formDataToSend);
                if (response?.data?.id) {
                    const galleryResults = await Promise.allSettled(
                        (galleryFormData?.images || []).map((item) => {
                            const dataToSend = new FormData();
                            dataToSend.append('image', item.file, item.name || 'uploaded-image.png');
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
            setImageDirty(false);
            setGalleryDirty(false);
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
        setImageDirty(true);
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
            setGalleryDirty(true);
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
                        setImageDirty(false);
                        setGalleryDirty(false);
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
                                                    setImageDirty(false);
                                                    setGalleryDirty(false);
                                                    setGalleryFormData(null);
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
              <ProjectModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleSubmit}
                formData={formData}
                setFormData={setFormData}
                currentProject={currentProject}
                projectData={projectData}
                handleKVChange={handleKVChange}
                addKVRow={addKVRow}
                removeKVRow={removeKVRow}
                handleImageUpload={handleImageUpload}
                handleGalleryUpload={handleGalleryUpload}
                galleryFormData={galleryFormData}
                setGalleryFormData={setGalleryFormData}
              />
            )}
        </div>
    );
}