import { UPLOAD_URL } from "./constants";
import { TopNode } from "./constants";
export function createTreesByTransferItems(items) {
  const p = [];
  for (const item of items) {
    p.push(createTreeByTransferItem(item));
  }
  return Promise.all(p);
}

function createTreeByTransferItem(item) {
  const entry = item.webkitGetAsEntry();
  return travel(entry);
}

function travel(entry) {
  return new Promise((resolve, reject) => {
    if (entry.isFile) {
      entry.file(
        (file) => {
          resolve({
            type: 0,
            file: file,
            progress: 0,
            parent: null,
          });
        },
        (error) => reject(error)
      );
    } else {
      let node = {
        type: 1,
        file: {
          name: entry.name,
        },
        progress: 0,
        children: [],
        parent: null,
      };
      let reader = entry.createReader();

      reader.readEntries(function (results) {
        if (results.length) {
          const p = [];
          for (const e of results) {
            p.push(travel(e));
          }
          Promise.all(p).then(
            (res) => {
              for (let i = 0; i < res.length; ++i) {
                node.children.push(res[i]);
                res[i].parent = [node, i];
              }
              node.progress = {
                loaded: Array(node.children.length).fill(0),
                total: Array(node.children.length).fill(0),
              };
              node.file.size = node.children.reduce(
                (acc, cur) => acc + cur.file.size,
                0
              );
              resolve(node);
            },
            (error) => reject(error)
          );
        } else {
          resolve(node);
        }
      });
    }
  });
}

export function createTreesByFiles(files) {
  const result = [];
  for (const file of files) {
    result.push({
      type: 0,
      file: file,
      progress: 0,
      parent: null,
    });
  }
  return result;
}
export function createTreeByFileRelativePath(files) {
  const top = {
    type: 1,
    file: {
      name: "",
      size: 0,
    },
    progress: {
      loaded: [],
      total: [],
    },
    parent: null,
    children: [],
  };
  for (const file of files) {
    createNodesBasedonPath(top, file.webkitRelativePath.split(/\//g), file);
  }
  top.children.forEach((e) => (e.parent = null));
  return top.children;
}

function createNodesBasedonPath(root, path, file) {
  let curr = root;
  for (let i = 0; i < path.length; ++i) {
    const p = path[i];
    let target = curr.children.find((node) => node.file.name === p);
    if (!target) {
      target = {
        type: i === path.length - 1 ? 0 : 1,
        file: i === path.length - 1 ? file : { name: path[i], size: 0 },
        progress: i === path.length - 1 ? 0 : { loaded: [], total: [] },
        parent: [curr, curr.children.length],
      };
      if (i !== path.length - 1) target.children = [];
      curr.children.push(target);
      curr.progress.loaded.push(0);
      curr.progress.total.push(0);
    }
    curr = target;
  }
  const ins = curr.file.size;
  while (curr.parent !== null) {
    curr.parent[0].file.size += ins;
    curr = curr.parent[0];
  }
}

export function uploadProcess(uploadFileList, setUploadFileList, setStatus) {
  //   console.log("call uploadProcess", uploadFileList);
  for (let i = 0; i < uploadFileList.length; ++i) {
    uploadFileList[i].parent = [TopNode, i];
    TopNode.children.push(uploadFileList[i]);
  }
  TopNode.progress = {
    loaded: Array(uploadFileList.length).fill(0),
    total: Array(uploadFileList.length).fill(0),
  };
  //   console.log("TopNode", TopNode);

  uploadFileOrDirectory(
    TopNode,
    () => {
      //   console.log("update: ", uploadFileList);
      setUploadFileList([...uploadFileList]);
    },
    setStatus
  );
}
function uploadFileOrDirectory(entry, update, setStatus) {
  if (entry === null) return;
  if (entry.type === 0) {
    // console.log("upload: ", entry.file.name);
    const xhr = new XMLHttpRequest();
    const data = new FormData();
    data.append("file", entry.file);
    xhr.open("POST", UPLOAD_URL);

    xhr.upload.addEventListener("progress", (e) => {
      const percent = Number(((e.loaded * 100) / e.total).toFixed(0));
      //   console.log("progress", percent);
      entry.progress = percent;
      propagateProcessUpward(entry, e.loaded, e.total, setStatus);
      //   console.log("before update");
      update();
      //   console.log("after update");
    });
    // xhr.upload.addEventListener("load", (e) => {
    //   const percent = Number(((e.loaded * 100) / e.total).toFixed(0));
    //   console.log("progress", percent);
    //   entry.progress = percent;
    //   propagateProcessUpward(entry, setStatus);
    //   console.log("before update");
    //   update();
    //   console.log("after update");
    // });
    xhr.send(data);
  } else {
    for (const e of entry.children) {
      uploadFileOrDirectory(e, update, setStatus);
    }
  }
}

function propagateProcessUpward(entry, loaded, total, setStatus) {
  if (entry.parent) {
    const [parent, idx] = entry.parent;
    parent.progress.loaded[idx] = loaded;
    parent.progress.total[idx] = total;

    propagateProcessUpward(
      parent,
      parent.progress.loaded.reduce((acc, cur) => acc + cur, 0),
      parent.progress.total.reduce((acc, cur) => acc + cur, 0),
      setStatus
    );
  } else {
    // topNode
    if (
      entry.progress.loaded.every(
        (item, idx) => entry.progress.total[idx] === item
      )
    )
      setStatus(2);
  }
}
