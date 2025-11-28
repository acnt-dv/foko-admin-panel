import { useEffect, useState } from "react";

const GalleryPreview = ({ galleryFormData, setGalleryFormData, currentProject }) => {
    const [previewUrls, setPreviewUrls] = useState([]);

    console.log(currentProject);

    useEffect(()=> {
        if(currentProject){
            setGalleryFormData({images: currentProject?.galleries});
        }
    },[]);

    useEffect(() => {
        const urls = galleryFormData?.images?.map((image) => {
            if (typeof image?.file === "string" || typeof image?.image === "string") {
                // Already a valid URL
                return image?.image;
            } else if (image?.file instanceof Blob || image?.file instanceof File) {
                // Convert Blob/File to Object URL
                return URL.createObjectURL(image?.file);
            } else {
                return ""; // fallback in case of unknown format
            }
        });

        setPreviewUrls(urls);

        // Cleanup object URLs to avoid memory leaks
        return () => {
            urls?.forEach((url) => {
                if (url.startsWith("blob:")) {
                    URL.revokeObjectURL(url);
                }
            });
        };
    }, [galleryFormData?.images]);

    return (
        <div className="flex flex-wrap gap-4">
            {previewUrls?.map((url, index) => (
                <div key={index} className="relative w-1/4 md:w-1/6 lg:w-1/8">
                    {(() => {
                        if (galleryFormData?.images?.[index]) {
                            galleryFormData.images[index].order = index + 1;
                        }
                        return null;
                    })()}
                    <img src={url} alt={`image-${index}`} className="h-20 w-20 object-cover rounded" />
                    <div className="absolute bottom-1 right-1 bg-black text-white text-xs px-2 py-1 rounded">
                      {index + 1}
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            const updatedImages = galleryFormData.images.filter((_, i) => i !== index);
                            setGalleryFormData({ ...galleryFormData, images: updatedImages });
                        }}
                        className="absolute top-[25%] left-[25%] bg-red-500 text-white text-4xl rounded-full w-[50%] h-[50%] opacity-50"
                    >
                        ×
                    </button>
                </div>
            ))}
        </div>
    );
};

export default GalleryPreview;
