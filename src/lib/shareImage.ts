// There's no API for a website (even an installed PWA) to write directly
// to the device's photo library — the only sanctioned path is handing the
// OS share sheet a file and letting the person tap "Save Image" there
// themselves. Fetching the url works whether it's a local blob: url from a
// freshly picked photo or a remote Supabase Storage url from one already
// saved, so this is the one path both the add and edit flows need.
export async function shareImageToDevice(url: string, filename = 'photo.jpg'): Promise<boolean> {
  const res = await fetch(url)
  const blob = await res.blob()
  const file = new File([blob], filename, { type: blob.type || 'image/jpeg' })
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({ files: [file] })
    return true
  }
  return false
}
