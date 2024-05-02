如何优雅地实现文件上传+文件夹上传+拖拽上传+进度追踪+...?

需求分析:

### 基础功能

- 显示
  - 上传文件或文件夹的`名字`、`类型`、`大小`、`状态`。
    - 类型
      - 文件夹的类型可以"文件夹"或或者没有
      - 文件的类型范围`MIME`。
        - 大小
          - 文件夹的大小为该文件夹及其子文件夹下所有文件的大小总和
        - 状态
          - 最少应该有的状态（假设上传一定成功，不会出现错误）
            - 未上传
            - 上传中(当处于此状态的时候要实时显示上传进度)
            - 上传完成
          - 其他扩展状态
            - 暂停
            - ...
  - 文件夹显示可以展开和折叠
  - 上传按钮在上传中是`disabled`，并且在没有文件上传的时候点击是不会触发上传的（可以在此时给出一个提醒）
- 多个文件或文件夹上传
- 文件选中方式
  - 通过`input[type="file"]`来选中
  - 拖拽
- 进度追踪
  - 一个文件的上传进度为`loaded/total`。
  - 一个文件夹的上传进度为该文件夹下（包括子文件夹）的所有文件的`loaded`之和除以所有文件的`total`之和。

![image.png](public/mockup.png)

### 扩展功能

- 取消某些选中的将要上传文件
- 暂停
  - 可以暂停上传的文件，之后再继续上传的时候不重新开始上传而是从上传完成的部分之后上传。
- 中断重试
  - 和暂停功能类似，只是这里的中断是不是人主动要求的，而是外部的一些不可预料的事件(网络中断、服务器故障..)造成的。
- 文件上传性能优化
  - 大文件分片上传
  - 并发上传
  - ....

我自己用`react+tailwindcss`尝试勉强实现了基础功能。
维护了一个树结构来记录文件上传的状态。
其中每个节点的字段含义

- `type`
  - `0`表示文件, `1`表示文件夹
- `file`
  - `File`: 对于文件来说是`File对象`，记录了文件的一些信息。
  - `{ name: <directory name>, size: <directory size>, type: "文件夹"}`: 对于文件夹来说只是记录了文件夹的名字、大小和类型。
- `children`:
  - 对于文件来说该字段是没有的。
  - 对于文件夹来说它是一个数组，包含一些节点，表示该文件夹下的所有文件和文件夹。
- `parent`
  - `[node, idx]`: `node`表示该节点的父节点，`idx`表示该节点在其父节点的`children`中位于第几个。
    - **问题: 如果我们想要删除某一个节点(相当于取消某个文件的上传)**
      - 方案 1 `splice`
        - 其后面的兄弟节点的`parent`也要改变，所有依赖`idx`的数据也改变。
        - 当我们需要恢复该节点的时候，还需要回退我们的修改（需要记住之前的`idx`，否则渲染的顺序就发生变化了。）
        - 实现起来还是比较麻烦，但没有占据不必要的空间。
      - 方案 2 `假的删除`
        - 在其父元素的`children数组`的对应位置(`idx`)设置为`null`，表示该节点已经被删除。
        - - 恢复的时候也容易。
        - 实现起来简单，但是可能浪费了一些空间，特别是当一层中文件条目比较多的时候。
        - **你有什么更好的方案吗？也可以重新设计这个 node，使得删除、恢复更容易，且占据的空间少。**
  - `null`: 表明该节点为根节点。
- `progress`:
  - `num`: 对于文件来说，它就是一个数值。由`XMLHttpRequest`实例的中的`upload`对象上`progress`事件中得到的`event.target`和`event.loaded`计算而来得到。(`loaded * 100 /tatoal`)。
  - `{loaded: [...], total: [....]}`: 对于文件夹来说，我们需要统计其子节点的`loaded`和`toatal`之后再计算得到其最终的进度。
    - 当一个子节点的的进度发生改变的时候，它会顺着`parent`，去修改其祖先节点中`progress.loaded`和`progress.total`。（这就是我们需要`parent`字段的原因）

**问题:这棵树在该`react`项目中为一个状态，应该保持它的不可变性。对于这种复杂的数据结构该怎么保持它的不可变性呢？借助`immer`?**

下面为更新进度的过程，该怎么修改保持不可变性呢？

```js
// src/utils.js
export function uploadProcess(uploadFileList, setUploadFileList, setStatus) {
  // TopNode用作哨兵，让边界条件处理更容易。
  for (let i = 0; i < uploadFileList.length; ++i) {
    uploadFileList[i].parent = [TopNode, i];
    TopNode.children.push(uploadFileList[i]);
  }
  TopNode.progress = {
    loaded: Array(uploadFileList.length).fill(0),
    total: Array(uploadFileList.length).fill(0),
  };
  uploadFileOrDirectory(
    TopNode,
    () => {
      setUploadFileList([...uploadFileList]);
    },
    setStatus
  );
}
function uploadFileOrDirectory(entry, update, setStatus) {
  if (entry === null) return;
  if (entry.type === 0) {
    const xhr = new XMLHttpRequest();
    const data = new FormData();
    data.append("file", entry.file);
    xhr.open("POST", UPLOAD_URL);

    xhr.upload.addEventListener("progress", (e) => {
      const percent = Number(((e.loaded * 100) / e.total).toFixed(0));
      entry.progress = percent;
      propagateProcessUpward(entry, e.loaded, e.total, setStatus);
      update();
    });
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
```

**我的实现一点也不优雅而且应该还有很多问题，欢迎指正。**
**如果你有更好的的方案，欢迎在解答区分享。最好有完整的代码和思路讲解。**
