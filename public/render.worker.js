onmessage = function (e) {
    var data = e.data
    const ctx = data.drawSurface.getContext('2d')
    const img = data.img
    setInterval(() => {
        self.frameImg(ctx, img)
    }, 100)
}
frameImg = function (ctx, img) {
    ctx.fillStyle=`rgb(${0},${0.222*255},${.333*255})`
    ctx.fillRect(0,0,ctx.width, ctx.height)
    ctx.drawImage(img,Math.random() * 100, Math.random() * 100)
}