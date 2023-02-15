import browserStorage from './browser-storage';

const get = jest.fn();
const set = jest.fn();
const clear = jest.fn();
const remove = jest.fn();

global.chrome = {
    storage: {
        local: {
            get,
            set,
            clear,
            remove,
        }
    }
};

describe('browser-storage', () => {
    const keys = ['empty'];

    it('should get data', (done) => {
        browserStorage.get(keys);

        setTimeout(() => {
            expect(get).toHaveBeenCalled();

            done();
        }, 0);
    });

    it('should set data', (done) => {
        browserStorage.set(keys);

        setTimeout(() => {
            expect(set).toHaveBeenCalled();

            done();
        }, 0);
    });

    it('should remove data', (done) => {
        browserStorage.remove(keys);

        setTimeout(() => {
            expect(remove).toHaveBeenCalled();

            done();
        }, 0);
    });

    it('should clear data', (done) => {
        browserStorage.clear();

        setTimeout(() => {
            expect(clear).toHaveBeenCalled();

            done();
        }, 0);
    });
});