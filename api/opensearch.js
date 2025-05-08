export default function handler(req, res) {
    res.setHeader('Content-Type', 'application/opensearchdescription+xml');
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    res.send(
    `<?xml version="1.0" encoding="UTF-8"?>
        <OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/">
        <ShortName>Unduck</ShortName>
        <Description>DuckDuckGo's bang redirects are too slow.</Description>
        <InputEncoding>UTF-8</InputEncoding>
        <Url type="text/html" template="https://unduck.jnz.ski?q={searchTerms}"/>
        <Image height="16" width="16">/icon.ico</Image>
    </OpenSearchDescription>`); } 
