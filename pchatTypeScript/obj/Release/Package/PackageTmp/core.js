var Maybe = (function () {
    function Maybe(value) {
        this.value = value;
        this.hasValue = false;
        if (value !== null) {
            this.hasValue = true;
        }
    }
    Maybe.prototype.isSome = function () {
        return this.hasValue;
    };
    Maybe.prototype.getValue = function () {
        return this.value;
    };

    Maybe.createNone = function () {
        return new Maybe(null);
    };
    return Maybe;
})();

var Size = (function () {
    function Size(width, height) {
        this.width = width;
        this.height = height;
    }
    return Size;
})();
