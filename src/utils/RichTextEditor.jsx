import ReactQuill from "react-quill";

export const quillModules = {
    toolbar: [
        [{header: [1, 2, 3, false]}],
        ['bold', 'italic', 'underline', 'strike'],
        [{list: 'ordered'}, {list: 'bullet'}],
        [{align: []}],
        ['link', 'image'],
        ['clean']
    ],
};

export const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'align',
    'link', 'image',
    'clean'
];

const RichTextEditor = ({
                            value,
                            onChange,
                            placeholder = "Write the content here…",
                            height = 'auto',
                            modules = quillModules,
                            formats = quillFormats
                        }) => {
    return (
        <ReactQuill
            value={value}
            onChange={onChange}
            modules={modules}
            formats={formats}
            placeholder={placeholder}
            style={{height}}
        />
    );
}

export default RichTextEditor;