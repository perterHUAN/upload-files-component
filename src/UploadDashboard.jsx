import { HardDrive, Upload, ChevronDown, ChevronUp } from "react-feather";
import React from "react";
function UploadDashboard({ uploadFileList, status }) {
  return (
    <>
      <table className="table-fixed w-full text-center mt-10">
        <thead>
          <tr className="border-b-2">
            <td className="py-3 bg-gray-50">文件名</td>
            <td className="py-3 bg-gray-50">类型</td>
            <td className="py-3 bg-gray-50">大小</td>
            <td className="py-3 bg-gray-50">状态</td>
          </tr>
        </thead>
        <tbody>
          {uploadFileList.map((file, idx) => {
            return (
              <UploadDashboardEntry entry={file} key={idx} status={status} />
            );
          })}
        </tbody>
      </table>
      {uploadFileList.length === 0 && (
        <div className="border-2 border-dashed border-t-0 h-52 flex flex-col items-center justify-center">
          <HardDrive />
          <p>暂无文件可上传</p>
        </div>
      )}
      <p className="mt-4">
        <span className="text-green-600 px-3 py-2 bg-gray-50 rounded font-semibold mr-2">
          已上传{" "}
          {uploadFileList.reduce(
            (pre, cur) => pre + (cur.progress == 100 ? 1 : 0),
            0
          )}
        </span>
        <span className="text-gray-500 px-3 py-2 bg-gray-50 rounded font-semibold mr-2">
          总数量 {uploadFileList.length}
        </span>
      </p>
    </>
  );
}

function UploadDashboardEntry({ entry, status }) {
  const [isExpand, setExpand] = React.useState(false);

  let progress = 0;

  if (entry.type === 1) {
    if (status !== 0) {
      const loaded = entry.progress.loaded.reduce((acc, cur) => acc + cur, 0);
      const total = entry.progress.total.reduce((acc, cur) => acc + cur, 0);
      if (total != 0) progress = ((loaded * 100) / total).toFixed(0);
    }
    return (
      <>
        <tr className="border-b-2 bg-blue-200">
          <td className="py-3 relative">
            <div
              className="absolute p-3 top-1/2 -translate-y-1/2"
              onClick={() => setExpand(!isExpand)}
            >
              {isExpand ? <ChevronUp /> : <ChevronDown />}
            </div>
            {entry.file.name}
          </td>
          <td className="py-3">文件夹</td>
          <td className="py-3">{entry.file.size}</td>
          <td className="py-3">
            {status === 0 ? (
              "未上传"
            ) : (
              <ProgressIndicator progress={progress} />
            )}
          </td>
        </tr>
        {isExpand &&
          entry.children.map((child, idx) => {
            return (
              <UploadDashboardEntry entry={child} key={idx} status={status} />
            );
          })}
      </>
    );
  }
  if (entry.type !== 0)
    throw new Error(
      "UploadDashboardEntry: entry.type !== 0 and entry.type !== 1"
    );

  return (
    <tr className="border-b-2">
      <td className="py-3">{entry.file.name}</td>
      <td className="py-3">{entry.file.type}</td>
      <td className="py-3">{entry.file.size}</td>
      <td className="py-3">
        {status === 0 ? (
          "未上传"
        ) : (
          <ProgressIndicator progress={entry.progress} />
        )}
      </td>
    </tr>
  );
}

function ProgressIndicator({ progress }) {
  return (
    <div className="w-12 h-12 grid place-content-center rounded-full bg-blue-100 mx-auto">
      {progress}%
    </div>
  );
}
export default UploadDashboard;
