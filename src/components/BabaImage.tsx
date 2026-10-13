import React from 'react';

const fallback = 'https://upload.wikimedia.org/wikipedia/commons/6/66/Neemkaroli_14.jpg';

export function BabaImage(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => setFailed(false), [props.src]);
  return <img {...props} src={failed ? fallback : props.src} onError={() => setFailed(true)} />;
}
