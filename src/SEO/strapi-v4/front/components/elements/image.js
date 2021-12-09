import { getStrapiMedia } from "utils/media"
import Image from "next/image"
import PropTypes from "prop-types"
import { mediaPropTypes } from "utils/types"

const NextImage = ({ media, ...props }) => {
  if (media) {
    const { url, alternativeText, width, height } = media.data.attributes

    const loader = ({ src }) => {
      return getStrapiMedia(src)
    }

    // The image has a fixed width and height
    if (props.width && props.height) {
      return (
        <Image loader={loader} src={url} alt={alternativeText || ""} {...props} />
      )
    }

    // The image is responsive
    return (
      <Image
        loader={loader}
        layout="responsive"
        width={width}
        height={height}
        objectFit="contain"
        src={url}
        alt={alternativeText || ""}
      />
    )
  }
  else {
    return <></>
  }
}

Image.propTypes = {
  media: mediaPropTypes.isRequired,
  className: PropTypes.string,
}

export default NextImage
