class Action {
    constructor() {
        this.actions = []
        this.speed = 6
    }

    add(action) {
        this.actions.push(action)
    }

    clear() {
        this.actions = []
    }

    getActions() {
        return this.actions
    }

    run() {
        if (this.actions.length == 0) {
            return false
        }
        var i = 0
        while (i < this.actions.length) {
            var action = this.actions[i]
            if (action.to - action.from > 0) {
                // move right
                var {
                    x,
                    y
                } = action.obj.getPosition()
                x = Math.min(x + this.speed, action.to)
                action.obj.setPosition(x, y)
            } else {
                // move left
                var {
                    x,
                    y
                } = action.obj.getPosition()
                x = Math.max(x - this.speed, action.to)
                action.obj.setPosition(x, y)
            }
            i = i + 1
        }

        i = 0
        while (i < this.actions.length) {
            var action = this.actions[i]
            var {
                x,
                y
            } = action.obj.getPosition()
            if (x != action.to) {
                return false
            }
            i = i + 1
        }
        this.actions = []
        return true
    }
}

class Tile {
    constructor(val, x, y, width, height) {
        this.val = val
        this.setPosition(x, y)
        this.setSize(width, height)
    }
    getPosition() {
        return {
            x: this.x,
            y: this.y
        }
    }
    setPosition(x, y) {
        this.x = x
        this.y = y
    }
    setSize(width, height) {
        this.width = width
        this.height = height
    }
    setHighlight(hl) {
        this.highlight = hl
    }
    draw(ctx) {
        if (this.highlight) {
            ctx.fillStyle = "#0000aa"
            ctx.fillRect(this.x, this.y, this.width, this.height)
            ctx.fillStyle = "#ffffff"
        } else {
            ctx.strokeStyle = "#ff0000"
            ctx.strokeRect(this.x, this.y, this.width, this.height)
            ctx.fillStyle = "#000000"
        }
        ctx.font = (this.width * 0.5) + "px Georgia"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(this.val.toString(), this.x + this.width / 2, this.y + this.height / 2)
    }

}

class Framework {
    init() {
        this.tiles = []
        this.canvas = document.getElementById("canvas")
        this.ctx = this.canvas.getContext("2d")
        this.action = new Action()
    }

    getAction() {
        return this.action
    }

    getCanvasRect() {
        return this.canvas.getBoundingClientRect()
    }

    run() {
        setInterval(() => {
            this.clear()
            this.preRender()
            this.render()
            this.postRender()
        }, 30)
    }

    addChild(c) {
        this.tiles.push(c)
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    }

    preRender() {}

    render() {
        for (var t of this.tiles) {
            t.draw(this.ctx)
        }
    }

    postRender() {
        this.action.run()
    }
}

class Logic extends Framework {
    init() {
        super.init()
        document.getElementById("commit")
                .addEventListener("click", ()=> {
            this.initData()
        }, false)
        document.getElementById("shuffle")
                .addEventListener("click", ()=> {
            this.shuffleData()
        }, false)
        this.code = document.getElementById("code")
        var p = document.getElementById("text")
        this.canvas.addEventListener("mousemove", (e) => {
            p.textContent = "X:" + e.x + "    " + "Y:" + e.y
        }, false)
        this.selector = document.getElementById("selector")
        this.cancel = false
    }

    initData() {
        this.cancel = true
        this.clear()
        this.tiles = []
        this.objects = []
        this.getAction().clear()

        console.log(this.selector.value)
        setTimeout(()=>{
            this.cancel = false
            try {
                this.input = eval(this.code.value)
            } catch (SyntaxError) {
                alert("Syntax error")
                return
            }
            if (!(this.input instanceof Array)) {
                alert("Data is not array")
                return
            }
            var fr = this.input.filter((x) => {
                if (isNaN(x)) {
                    return x
                }
            })
            if (fr.length > 0) {
                alert("Contain not number")
                return
            }
            var count = this.input.length
            var margin = 5
            var rect = this.getCanvasRect()
            var size = Math.floor((rect.width - margin * (count + 1)) / count)
            for (var i = 0; i < count; i++) {
                var x = size * i + margin * (i + 1)
                var y = 200
                var t = new Tile(this.input[i], x, y, size, size)
                this.addChild(t)
                this.objects.push({
                    object: t
                })
            }

            this.impl(this.selector.value)
        }, 1000)
    }

    shuffleData() {
        var s = ["["]
        for(var i = 0;i < 12;i++) {
            s.push(Math.round(Math.random() * 100))
            s.push(",")
        }
        s[s.length - 1] = "]"
        console.log(s)
        this.code.value = s.join("")
    }

    highlight(l, r, callback) {
        var lobj = this.objects[l]
        var robj = this.objects[r]

        lobj.object.setHighlight(true)
        robj.object.setHighlight(true)

        setTimeout(() => {
            lobj.object.setHighlight(false)
            robj.object.setHighlight(false)

            callback()
        }, 1000)
    }

    swap(l, r, callback) {
        var lobj = this.objects[l]
        var robj = this.objects[r]

        var tmp = lobj
        this.objects[l] = this.objects[r]
        this.objects[r] = tmp

        var action = this.getAction()
        action.add({
            obj: lobj.object,
            from: lobj.object.getPosition().x,
            to: robj.object.getPosition().x
        })
        action.add({
            obj: robj.object,
            from: robj.object.getPosition().x,
            to: lobj.object.getPosition().x
        })

        this.registerSwapCallback(() => {
            lobj.object.setHighlight(false)
            robj.object.setHighlight(false)
            callback()
        })
    }

    async impl(value) {
        var fn = eval(value)
        var gen = fn(this.input)
        while (!this.cancel) {
            var n = gen.next()
            if (n.value) {
                var {
                    t,
                    l,
                    r
                } = n.value
                if (t == "index") {
                    await new Promise((resolve, reject) => {
                        this.highlight(l, r, () => {
                            resolve()
                        })
                    })
                } else {
                    await new Promise((resolve, reject) => {
                        this.swap(l, r, () => {
                            resolve()
                        })
                    })
                }
            } else {
                break
            }
        }

    }

    registerSwapCallback(callback) {
        this.swapCallback = callback
    }

    postRender() {
        var endActing = this.action.run()
        if (endActing) {
            this.swapCallback()
        }
    }
}

function* sortSlowBubble(input) {
    for (var i = 0; i < input.length; i++) {
        for (var j = i + 1; j < input.length; j++) {
            yield {
                t: "index",
                l: i,
                r: j
            }
            if (input[i] > input[j]) {
                var tmp = input[j]
                input[j] = input[i]
                input[i] = tmp
                yield {
                    t: "move",
                    l: i,
                    r: j
                }
            }
        }
    }
}

// bubble
function* sortBubble(input) {
    for (var i = 0; i < input.length; i++) {
        for (var j = 0; j < input.length - i - 1; j++) {
            yield {
                t: "index",
                l: j,
                r: j + 1
            }
            if (input[j] > input[j + 1]) {
                var tmp = input[j]
                input[j] = input[j + 1]
                input[j + 1] = tmp
                yield {
                    t: "move",
                    l: j,
                    r: j + 1
                }
            }
        }
    }
}

// selection sort
function* sortSelection(input) {
    for (var i = 0; i < input.length; i++) {
        var min = i
        var j = i
        for (; j < input.length; j++) {
            yield {
                t: "index",
                l: i,
                r: j
            }
            if (input[min] > input[j]) {
                min = j
            }
        }
        if (min != i) {
            var tmp = input[i]
            input[min] = input[i]
            input[i] = tmp
            yield {
                t: "move",
                l: i,
                r: min
            }
        }
    }
}

// shell sort
function* sortShell(input) {
    var increment = input.length
    do {
        increment = Math.floor(increment / 3) + 1
        for (var i = increment; i < input.length; i++) {
            yield {
                t: "index",
                l: i - increment,
                r: i
            }
            if (input[i] < input[i - increment]) {
                var j = i - increment
                for (; j >= 0 && input[j + increment] < input[j]; j -= increment) {
                    yield {
                        t: "index",
                        l: j,
                        r: j + increment
                    }
                    var tmp = input[j + increment]
                    input[j + increment] = input[j]
                    input[j] = tmp
                    yield {
                        t: "move",
                        l: j,
                        r: j + increment
                    }
                }
            }
        }
    } while (increment > 1)
}

// heap sort
function* sortHeap(input) {
    function* heapAdjust(input, s, m) {
        for (var i = 2 * s; i < m; i *= 2) {
            if (input[i] < input[i + 1]) {
                i += 1
            }
            yield {
                t: "index",
                l: s,
                r: i
            }
            if (input[s] >= input[i]) {
                break
            }
            var temp = input[s]
            input[s] = input[i]
            input[i] = temp
            yield {
                t: "move",
                l: s,
                r: i
            }
            s = i
        }
    }

    function* heapSwap(input, s, m) {
        var temp = input[s]
        input[s] = input[m]
        input[m] = temp
        yield {
            t: "index",
            l: s,
            r: m
        }
        yield {
            t: "move",
            l: s,
            r: m
        }
    }

    for (var i = Math.floor((input.length - 1) / 2); i >= 0; i--) {
        yield* heapAdjust(input, i, input.length)
    }

    for (var i = input.length - 1; i > 0; i--) {
        yield* heapSwap(input, 0, i)
        yield* heapAdjust(input, 0, i - 1)
    }
}

// quick sort
function* sortQuickNoRecursive(input) {
    function* partition(input, low, high) {
        var pivotkey = input[low]
        while (low < high) {
            yield {
                t: "index",
                l: low,
                r: high
            }
            while (low < high && pivotkey <= input[high]) {
                yield {
                    t: "index",
                    l: low,
                    r: high
                }
                high--
            }
            // swap(input, low, high)
            var tmp = input[low]
            input[low] = input[high]
            input[high] = tmp
            yield {
                t: "index",
                l: low,
                r: high
            }
            yield {
                t: "move",
                l: low,
                r: high
            }
            while (low < high && pivotkey >= input[low]) {
                yield {
                    t: "index",
                    l: low,
                    r: high
                }
                low++
            }
            tmp = input[low]
            input[low] = input[high]
            input[high] = tmp
            yield {
                t: "index",
                l: low,
                r: high
            }
            yield {
                t: "move",
                l: low,
                r: high
            }
        }
        // return low
        yield {
            t: "result",
            r: low
        }
    }

    var stack = []
    stack.push([0, input.length - 1])
    while (stack.length > 0) {
        var range = stack.pop()
        var gen = partition(input, range[0], range[1])
        var n = gen.next()
        while (n.done == false) {
            if (n.value.t == "result") {
                break
            } else {
                yield n.value
                n = gen.next()
            }
        }
        var pivot = n.value.r
        if (range[0] < pivot - 1) {
            stack.push([range[0], pivot - 1])
        }
        if (pivot + 1 < range[1]) {
            stack.push([pivot + 1, range[1]])
        }
    }
}

var logic = new Logic()
logic.init()
logic.run()