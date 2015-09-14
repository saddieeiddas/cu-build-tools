'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

exports['default'] = function () {
  return function disableCache(req, res, next) {
    res.setHeader('Last-Modified', new Date().toUTCString());
    next();
  };
};

module.exports = exports['default'];
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInV0aWwvY29ubmVjdERpc2FibGVDYWNoZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7cUJBQWUsWUFBVztBQUN4QixTQUFPLFNBQVMsWUFBWSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFO0FBQzNDLE9BQUcsQ0FBQyxTQUFTLENBQUUsZUFBZSxFQUFFLEFBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDO0FBQzVELFFBQUksRUFBRSxDQUFDO0dBQ1IsQ0FBQztDQUNIIiwiZmlsZSI6InV0aWwvY29ubmVjdERpc2FibGVDYWNoZS5qcyIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gZnVuY3Rpb24gZGlzYWJsZUNhY2hlKHJlcSwgcmVzLCBuZXh0KSB7XG4gICAgcmVzLnNldEhlYWRlciggJ0xhc3QtTW9kaWZpZWQnLCAobmV3IERhdGUoKSkudG9VVENTdHJpbmcoKSk7XG4gICAgbmV4dCgpO1xuICB9O1xufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
