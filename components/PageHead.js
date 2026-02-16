import Head from 'next/head'

/**
 * Page Head Component
 * Sets page title and meta tags
 */
export default function PageHead({ title, description }) {
  const fullTitle = title ? `${title} | AI Quiz Generator` : 'AI Quiz Generator'
  const defaultDescription = 'Generate AI-powered quizzes from PDF books using Google Gemini AI'

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description || defaultDescription} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="icon" href="/favicon.ico" />
    </Head>
  )
}
