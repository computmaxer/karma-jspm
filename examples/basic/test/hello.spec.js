'use strict';

import {hello} from 'src/hello';

describe('hello', () => {
    it('should return Hello Foo', function () {
        expect(hello()).toEqual('Hello Foo');
    });
});
