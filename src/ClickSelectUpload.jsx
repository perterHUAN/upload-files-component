import { createTreesByFiles, createTreeByFileRelativePath } from "./utils";
function ClickSelectUpload({ setUploadFileList }) {
  function handleChangeFiles(e) {
    console.log("change", e.target.files);
    // setUploadFileList();
    const trees = createTreesByFiles(e.target.files);
    console.log("trees: ", trees);
    setUploadFileList(trees);
  }
  function handleChangeDirectory(e) {
    console.log("change");
    const tree = createTreeByFileRelativePath(e.target.files);
    console.log("tree: ", tree);

    setUploadFileList(tree);
  }
  return (
    <div className="mt-4">
      <label className="px-4 py-2 inline-block bg-gray-50 mr-2 rounded cursor-pointer select-none">
        上传文件
        <input
          type="file"
          name="files"
          multiple
          className="sr-only"
          onChange={handleChangeFiles}
        />
      </label>
      <label className="px-4 py-2 inline-block bg-gray-50 rounded cursor-pointer select-none">
        上传文件夹
        <input
          type="file"
          multiple
          name="directory"
          webkitdirectory=""
          className="sr-only"
          onChange={handleChangeDirectory}
        />
      </label>
    </div>
  );
}
export default ClickSelectUpload;
