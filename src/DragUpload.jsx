import { UploadCloud } from "react-feather";
import { createTreesByTransferItems } from "./utils";
function DragUpload({ setUploadFileList }) {
  function handleDragOver(event) {
    event.preventDefault();
  }
  async function handleDrop(event) {
    event.preventDefault();
    const trees = await createTreesByTransferItems(event.dataTransfer.items);
    console.log("trees: ", trees);
    setUploadFileList(trees);
  }
  return (
    <div
      className="border-2 border-dashed h-52 grid place-content-center"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <p className="text-lg text-gray-400 flex flex-row gap-2">
        <UploadCloud />
        拖拽文件文件上传
      </p>
    </div>
  );
}

export default DragUpload;
