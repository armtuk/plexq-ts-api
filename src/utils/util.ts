
export function lookup(obj: any, key: string): any {
    //isDebug && console.log("Asked to lookup ", key, " in ", obj);
    return key.split('.').reduce((o, k) => o && o[k], obj);
}

export function setFromStringPath(obj: any, key: string, value: any): any {
    if (obj === undefined) {
        throw new Error("setFromStringPath called on an undefined object as the target for " + key + " : " + value)
    }
    const [h, hx] = key.split('.')

    if (!h) {
        throw new Error("key for string path must have some value, but received a falsy value")
    }
    else {
        if (hx === undefined) {
            obj[h] = value
            return obj
        } else {
            const v = obj[h] || (isNaN(parseInt(hx)) ? {} : [])
            obj[h] = setFromStringPath(v, key.substr(key.indexOf(".") + 1), value)
            return obj
        }
    }
}

export function setListFromStringPath(obj: any, key: string, value: any): any {
    const [h, hx] = key.split('.')
    if (!h) {
        throw new Error("key for string path must have some value, but received a falsy value")
    }
    else {
        if (hx === undefined) {
            if (obj[h]) {
                obj[h] = [...obj[h], value]
            } else {
                obj[h] = [value]
            }
            return obj
        } else {
            const v = obj[h] || {}
            obj[h] = setFromStringPath(v, key.substr(key.indexOf(".") + 1), value)
            return obj
        }
    }
}

export const isBlank = (str: string | undefined | null) => !str || str.trim() === ""

export function head<T>(arr: Array<T> | undefined): T | undefined {
    if (arr) {
        return arr.length === 0 ? undefined : arr[0]
    }
    else return undefined
}

export const generatePassword = () => {
    let pass = '';
    const str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
        'abcdefghijklmnopqrstuvwxyz0123456789@#%';
    const number = '0123456789';
    const special = '@#%';

    const randChar = () => str.charAt(Math.floor(Math.random() * str.length))

    const randSpecial = () => special.charAt(Math.floor(Math.random() * special.length))

    const randNumber = () => number.charAt(Math.floor(Math.random() * number.length))

    for (let i = 1; i <= 8; i++) {
        let char = randChar()
        pass += char
    }

    pass += randNumber()
    pass += randSpecial()

    return pass;
}


export function notUndefined<T>(x: T | undefined): x is T {
    return x !== undefined;
}

export function sum(x: Array<number> | undefined) {
    if (!x) return 0
    else return x.reduce((a, b) => (a || 0) + (b || 0), 0)
}

export function olderDate(a: Date | undefined, b: Date | undefined): Date | undefined {
    if (a && b) return a < b ? a : b
    else if (b && !a) return b
    else if (a && !b) return a
    else return undefined
}

export const scrubKeyList = ["password", "cc", "ccNumber", "pan", "pass"]

export const scrubLogObject = <T>(a: T): T => {
    return Object.fromEntries(new Map(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      Object.keys(a as any).map(key => {
            if (scrubKeyList.includes(key) || scrubKeyList.find(x => (a as any)[key])) {
                return [key, "*********"]
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                if (typeof (a as any)[key] === "object") {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    return [key, scrubLogObject((a as any)[key])]
                }
                else {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                    return [key, (a as any)[key]]
                }
            }
        })
    )) as T
}