import _ from 'lodash';

import temps from 'temps';

const { classs } = temps;

function wInside(box1, box2) {
  return box1.left >= box2.left && box1.right <= box2.right
    && box1.top >= box2.top && box1.bottom <= box2.bottom;
}

function boxArea(box) {
  return (box.right - box.left) * (box.bottom - box.top);
}

function boxsArea(boxs) {
  const xs = [];
  const ys = [];
  _.each(boxs, (box) => {
    xs.push(box.left);
    xs.push(box.right);
    ys.push(box.top);
    ys.push(box.bottom);
  });
  xs.sort();
  ys.sort();
  let h = 0;
  for (let i = 0; i < xs.length - 1; i += 1) {
    for (let j = 0; j < ys.length - 1; j += 1) {
      const boxC = {
        left: xs[i],
        right: xs[i + 1],
        top: ys[j],
        bottom: ys[j + 1],
      };
      let wFound = false;
      _.each(boxs, (box) => {
        if (wInside(boxC, box)) {
          wFound = true;
          return false;
        }
      });
      if (wFound) h += boxArea(boxC);
    }
  }
  return h;
}

export default function combineBoxs(boxs) {
  _.each(boxs, (box) => {
    box.class = classs[box.class - 1];
  });
  let boxsC = [...boxs];
  for (let o = 0; o < boxs.length - 1; o += 1) {
    let wFound = false;
    for (let i = 0; i < boxsC.length - 1; i += 1) {
      for (let j = i + 1; j < boxsC.length; j += 1) {
        if (boxsC[i].class.name !== boxsC[j].class.name) continue;
        const v1 = [boxsC[i].right - boxsC[i].left, boxsC[i].bottom - boxsC[i].top];
        const v2 = [boxsC[j].right - boxsC[j].left, boxsC[j].bottom - boxsC[j].top];
        if ((v1[0] * v2[0] + v1[1] * v2[1]) / (v1[0] ** 2 + v1[1] ** 2) ** 0.5 / (v2[0] ** 2 + v2[1] ** 2) ** 0.5 < 0.9) continue;
        const boxsPair = [boxsC[i], boxsC[j]];
        const boxO = {
          class: boxsC[i].class,
          left: Math.min(..._.map(boxsPair, box => box.left)),
          right: Math.max(..._.map(boxsPair, box => box.right)),
          top: Math.min(..._.map(boxsPair, box => box.top)),
          bottom: Math.max(..._.map(boxsPair, box => box.bottom)),
        };
        if (boxsArea(boxsPair) / boxArea(boxO) > 0.5) {
          boxsC = [...boxsC.slice(0, i), ...boxsC.slice(i + 1, j), ...boxsC.slice(j + 1), boxO];
          wFound = true;
          break;
        }
      }
      if (wFound) break;
    }
    if (!wFound) break;
  }
  return boxsC;
}
