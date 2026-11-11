import React from "react";
import { Link } from "react-router-dom";
import schoolCampusAerial from "../../../assets/sheerwood-campus-aerial-web.jpg";
import galleryCulture from "../../../assets/gallery-culture.png";
import galleryCampus from "../../../assets/gallery-campus-library.png";
import galleryAcademics from "../../../assets/gallery-academics.png";
import Button from "../../../components/Button/Button";
import "./GallerySection.css";

const galleryItems = [
  {
    image: schoolCampusAerial,
    alt: "Aerial view of the sprawling 70-acre Sherwood College campus in Nainital",
    title: "Our Historic Campus",
    tag: "Campus Heritage",
    className: "sherwood-gallery__item--tall",
  },
  {
    image: galleryCulture,
    alt: "Students performing at a college cultural event and musical concert",
    title: "Co-Curricular & Arts",
    tag: "Student Life",
    className: "sherwood-gallery__item--wide",
  },
  {
    image: galleryCampus,
    alt: "The Sherwood College library courtyard and colonial cloisters",
    title: "Library & Courtyards",
    tag: "Facilities",
    className: "",
  },
  {
    image: galleryAcademics,
    alt: "Students engaging in collaborative experiments in the science laboratory",
    title: "STEM & Discovery",
    tag: "Academics",
    className: "",
  },
];

export default function GallerySection() {
  return (
    <section id="gallery" className="sherwood-gallery">
      <div className="sherwood-gallery__container">
        <header className="sherwood-gallery__header">
          <div className="sherwood-gallery__header-left">
            <span className="sherwood-section-label">SHERWOOD MOMENTS</span>
            <h2 className="sherwood-gallery__title">Life in <em>Focus</em></h2>
          </div>
          <Button as={Link} to="/gallery" variant="outline" size="sm">
            View Full Gallery <span>→</span>
          </Button>
        </header>

        <div className="sherwood-gallery__grid">
          {galleryItems.map((item) => (
            <Link
              key={item.title}
              to="/gallery"
              className={`sherwood-gallery__item ${item.className}`.trim()}
            >
              <img
                src={item.image}
                alt={item.alt}
                loading="lazy"
                width="600"
                height="400"
                className="sherwood-gallery__img"
              />
              <div className="sherwood-gallery__overlay">
                <span className="sherwood-gallery__tag">{item.tag}</span>
                <strong className="sherwood-gallery__item-title">{item.title}</strong>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

