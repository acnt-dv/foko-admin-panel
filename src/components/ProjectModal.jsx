import RichTextEditor from "../utils/RichTextEditor.jsx";
import GalleryPreview from "./GalleryPreview.jsx";

const ProjectModal = ({
                          open,
                          onClose,
                          onSubmit,
                          formData,
                          setFormData,
                          currentProject,
                          projectData,
                          handleKVChange,
                          addKVRow,
                          removeKVRow,
                          handleImageUpload,
                          handleGalleryUpload,
                          galleryFormData,
                          setGalleryFormData,
                      }) => {
    if (!open) return null;

    return (
        <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>

                <div
                    className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <form onSubmit={onSubmit} className="p-6">
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
                                <label className="block text-sm font-medium text-gray-700">Gallery Images</label>
                                <input
                                    type="file"
                                    required={!currentProject}
                                    multiple
                                    accept="image/*"
                                    onChange={handleGalleryUpload}
                                    className="mt-1 block w-full"
                                />
                                <div className="mt-2">
                                    <GalleryPreview
                                        galleryFormData={galleryFormData}
                                        setGalleryFormData={setGalleryFormData}
                                        currentProject={currentProject}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 sm:mt-6 flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
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
    );
}

export default ProjectModal;