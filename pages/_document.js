import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="ar" dir="rtl">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body className="font-tajawal bg-darker text-white">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
