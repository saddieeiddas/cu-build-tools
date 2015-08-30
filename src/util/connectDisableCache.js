export default function() {
  return function disableCache(req, res, next) {
    res.setHeader( 'Last-Modified', (new Date()).toUTCString());
    next();
  };
}
