export function wait(time: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(() => resolve(), time)
    })
}

export function replaceKeyWithRand<T>(item: T, key: keyof T): T {

    if (typeof item[key] !== 'string') {
        throw new Error(`Key ${String(key)} is not a string in the provided item.`);
    }

    item[key] = item[key]?.replace("{}", Math.random().toString(36).substring(2, 15)) as unknown as T[keyof T];
    return item;
}