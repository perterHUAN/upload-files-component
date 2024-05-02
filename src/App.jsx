import React from "react";
import DragUpload from "./DragUpload";
import ClickSelectUpload from "./ClickSelectUpload";
import UploadDashboard from "./UploadDashboard";
import { uploadProcess } from "./utils";
import { statusToString } from "./constants";

function App() {
  const [uploadFileList, setUploadFileList] = React.useState([]);
  const [status, setStatus] = React.useState(0); // 0: 未上传  1: 上传中 2:上传完成

  function handleUpload() {
    if (uploadFileList.length === 0) return;
    setStatus(1);
    uploadProcess(uploadFileList, setUploadFileList, setStatus);
  }
  return (
    <>
      <DragUpload setUploadFileList={setUploadFileList} />
      <ClickSelectUpload setUploadFileList={setUploadFileList} />
      <UploadDashboard uploadFileList={uploadFileList} status={status} />
      <UploadButton
        status={status}
        setStatus={setStatus}
        handleUpload={handleUpload}
      />
    </>
  );
}

function UploadButton({ status, handleUpload }) {
  return (
    <div className="flex flex-row items-center justify-center">
      <button
        disabled={status === 1}
        className="select-none w-52 rounded py-2 bg-gray-50 font-semibold text-gray-500 [&:not(:disabled)]:hover:text-gray-50 [&:not(:disabled)]:hover:bg-gray-400 [&:not(:disabled)]:active:translate-y-2"
        onClick={handleUpload}
      >
        {statusToString[status]}
      </button>
    </div>
  );
}

export default App;
