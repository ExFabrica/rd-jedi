import { getStrapiMedia } from "../lib/media"
import NextImage from "next/image"

const Image = ({ image, style }) => {
  const { url, alternativeText } = image

  const loader = () => {
    return getStrapiMedia(image)
  }

  return (
    <img
      width={image.width}
      height={image.height}
      src={ "http://localhost:1337" + url}
      alt={alternativeText || ""}
    />
  )
}

export default Image
