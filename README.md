### 说明
本demo实现拖拽上传或点击上传图片，并扫描识别二维码信息进行展示，集成了两个js库共同完成
- jsqrcode库：https://github.com/LazarSoft/jsqrcode.git 
- jsOR库：https://github.com/cozmo/jsQR.git

jsqrcode在实际解析时并不够健壮，而jsOR的api参数在页面无法获取，因而结合了两个库，jsqrcode获取到参数后调用jsOR的api进行解析。jsqrcode的改造集中在**qrcode.js**脚本：
- 实际解析
```javascript
 // qrcode.result = qrcode.process(context);		//旧
var result = jsQR.decodeQRFromImage(qrcode.imagedata.data, qrcode.imagedata.width, qrcode.imagedata.height);		//新，调用jsQR
 qrcode.result = qrcode.utf8ToUtf16(result);		//转utf16以识别中文，实现此方法
```
- 回调展示
```javascript
if(qrcode.callback!=null)
        qrcode.callback(qrcode.result, qrcode.status);		//回调方法添加转码状态
```

### 用法
```javascript
//引入库
<script src="js/jsQR.js"></script>
<script src="js/qrcode.js"></script>

//注册回调
qrcode.callback = function (d, status) {
	....
}

//解析调用
qrcode.decode(data);
```

### demo使用
命令行依次执行
```javascript
git clone https://github.com/hongpinglover/qrDecode.git
npm install
grunt serve
```