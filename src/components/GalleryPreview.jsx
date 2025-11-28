import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import api from "../config/axios.js";
import {toast} from "react-toastify";

const SortableImage = ({ url, index, img = {}, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: index });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative w-1/4 md:w-1/6 lg:w-1/8 cursor-move"
    >
      <img
        src={url}
        alt={`image-${index}`}
        className="h-20 w-20 object-cover rounded"
      />

      <div className="absolute bottom-1 right-1 bg-black text-white text-xs px-2 py-1 rounded">
        {img?.order ?? index + 1}
      </div>

      <button
        type="button"
        onClick={() => onDelete(index)}
        className="absolute top-[25%] left-[25%] bg-red-500 text-white text-4xl rounded-full w-[50%] h-[50%] opacity-50"
      >
        ×
      </button>
    </div>
  );
};

const GalleryPreview = ({ galleryFormData, setGalleryFormData, currentProject }) => {
  const [previewUrls, setPreviewUrls] = useState([]);

  useEffect(() => {
    if (currentProject) {
      setGalleryFormData({
        images: (currentProject?.galleries || []).map((img, idx) => ({
          ...img,
          order: img?.order ?? idx + 1,
        })),
      });
    }
  }, [currentProject, setGalleryFormData]);

  useEffect(() => {
    const images = galleryFormData?.images || [];

    const normalized = images.map((img, idx) => ({
      ...img,
      order: img?.order ?? idx + 1,
    }));

    const needsUpdate = normalized.some((img, i) => img.order !== images[i].order);

    if (needsUpdate) {
      setGalleryFormData(prev => ({
        ...prev,
        images: normalized
      }));
    }

    const urls = normalized.map((image) => {
      if (typeof image?.file === "string" || typeof image?.image === "string") {
        return image?.image || image?.file;
      } else if (image?.file instanceof Blob || image?.file instanceof File) {
        return URL.createObjectURL(image?.file);
      } else {
        return "";
      }
    });

    setPreviewUrls(urls);

    return () => {
      urls.forEach((url) => {
        if (typeof url === "string" && url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [galleryFormData?.images]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = active.id;
    const newIndex = over.id;

    const reordered = arrayMove(galleryFormData?.images || [], oldIndex, newIndex);
    const updated = reordered.map((img, i) => ({
      ...img,
      order: i + 1,
    }));

    setGalleryFormData((prev) => ({ ...prev, images: updated }));
  };

  const handleDelete = (index) => {
    const updated = (galleryFormData?.images || [])
        .filter((_, i) => i !== index)
        .map((img, i) => ({ ...img, order: i + 1 }));

    const deletedImage = galleryFormData?.images?.[index];

    if (deletedImage?.id && currentProject?.id) {
      api
          .delete(`/projects/${currentProject.id}/gallery/${deletedImage.id}`)
          .then(() => {
            toast.success("Image deleted successfully");

            // re-render gallery
            setGalleryFormData((prev) => ({ ...prev, images: updated }));
          })
          .catch((err) => console.error("Failed to delete gallery image", err));

      return; // important: avoid running setGalleryFormData twice
    }

    // if image has no id (new image before upload)
    setGalleryFormData((prev) => ({ ...prev, images: updated }));
    toast.success("Image removed");
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={(galleryFormData?.images || []).map((_, i) => i)}
        strategy={rectSortingStrategy}
      >
        <div className="flex flex-wrap gap-4">
          {previewUrls.map((url, index) => (
            <SortableImage
              key={index}
              url={url}
              index={index}
              img={(galleryFormData?.images || []).map((img, idx) => ({ ...img, order: img?.order ?? idx + 1 }))[index]}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default GalleryPreview;
