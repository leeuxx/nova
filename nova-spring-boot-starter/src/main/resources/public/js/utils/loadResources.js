;(function () {
  // 加载单个资源（已存在则跳过），返回 Promise
  function loadOne(path) {
    return new Promise(function (resolve, reject) {
      var isCss = /\.css(\?|$)/i.test(path);
      var existing = isCss
        ? document.querySelector('link[href="' + path + '"]')
        : document.querySelector('script[src="' + path + '"]');
      if (existing) {
        resolve();
        return;
      }
      var el = document.createElement(isCss ? 'link' : 'script');
      if (isCss) {
        el.rel = 'stylesheet';
        el.href = path;
      } else {
        el.src = path;
      }
      el.onload = function () { resolve(); };
      el.onerror = function () { reject(new Error('Failed to load ' + path)); };
      document.head.appendChild(el);
    });
  }

  // 顺序加载列表
  function loadList(list, index) {
    if (index >= list.length) return Promise.resolve();
    return loadOne(list[index]).then(function () {
      return loadList(list, index + 1);
    });
  }

  // 对外暴露：支持单个路径（"css" || "js"）或数组（["css", "js"]）
  window.loadResources = function (paths) {
    var list = Array.isArray(paths) ? paths : [paths];
    return loadList(list, 0);
  };

})();
