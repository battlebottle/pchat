
class Maybe<T> {
    private hasValue = false
    isSome() {
        return this.hasValue;
    }
    getValue() {
        return this.value;
    }

    static createNone<T>() {
        return new Maybe<T>(null);
    }

    constructor(private value : T) {
        if (value !== null) {
            this.hasValue = true;
        }
    }

}

class Size {
    constructor(public width : number, public height : number) { }
}