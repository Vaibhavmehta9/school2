import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import schoolCampusAerial from "../../../assets/sheerwood-campus-aerial-web.jpg";
import galleryAcademics from "../../../assets/gallery-academics.webp";
import gallerySports from "../../../assets/gallery-sports.webp";
import galleryCulture from "../../../assets/gallery-culture.webp";
import galleryCampus from "../../../assets/gallery-campus-library.webp";
import galleryHostel from "../../../assets/gallery-hostel-building.webp";
import galleryAuditorium from "../../../assets/sheerwood-auditorium-web.jpg";
import Button from "../../../components/Button/Button";
import SchoolCrest from "../../../components/SchoolCrest";
import { isReducedMotion, gsap } from "../../../utils/motion";
import "./GallerySection.css";

const galleryItems = [
  {
    image: schoolCampusAerial,
    alt: "Aerial view of the historic 45-acre Sherwood College campus in Nainital",
    title: "Our Historic Campus Quad",
    tag: "Campus Heritage",
    type: "photo",
    className: "sherwood-gallery__item--hero",
  },
  {
    image: galleryAcademics,
    alt: "Academic infrastructure and learning blocks at Sherwood College",
    title: "STEM & Discovery",
    tag: "Academics",
    type: "photo",
    className: "sherwood-gallery__item--sm",
  },
  {
    image: gallerySports,
    alt: "Outdoor swimming pool and sports facilities on the Sherwood mountain campus",
    title: "Athletics & Character",
    tag: "Sports",
    type: "photo",
    className: "sherwood-gallery__item--sm",
  },
  {
    image: galleryCulture,
    alt: "Students and faculty gathered in the outdoor quadrangle for college events",
    title: "The Arts & Cultural Legacy",
    tag: "Milman Hall",
    type: "photo",
    className: "sherwood-gallery__item--wide",
  },
  {
    image: galleryCampus,
    alt: "Colonial stone cloisters corridor overlooking the courtyard",
    title: "Library & Courtyards",
    tag: "Quiet Study",
    type: "photo",
    className: "sherwood-gallery__item--sm",
  },
  {
    image: galleryHostel,
    alt: "Main historic Gothic school building and residential campus",
    title: "Boarding Life",
    tag: "Pastoral Care",
    type: "photo",
    className: "sherwood-gallery__item--sm",
  },
  {
    image: galleryAuditorium,
    alt: "Gatherings in the historic Sherwood College auditorium",
    title: "College Assemblies",
    tag: "Tradition",
    type: "photo",
    className: "sherwood-gallery__item--sm",
  },
  {
    type: "callout",
    title: "Explore Full Campus Archive",
    tag: "600+ Heritage Photos",
    className: "sherwood-gallery__item--callout",
  },
];

export default function GallerySection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    if (isReducedMotion()) return undefined;

    const ctx = gsap.context(() => {
      gsap.from(".sherwood-gallery__item", {
        y: 40,
        opacity: 0,
        duration: 0.75,
        stagger: 0.08,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".sherwood-gallery__grid",
          start: "top 82%",
          once: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="gallery" className="sherwood-gallery" ref={sectionRef}>
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
          {galleryItems.map((item) => {
            if (item.type === "callout") {
              return (
                <Link
                  key={item.title}
                  to="/gallery"
                  className={`sherwood-gallery__item ${item.className}`.trim()}
                  aria-label="View complete 70-acre campus photographic archive"
                >
                  <div className="sherwood-gallery__callout-inner">
                    <div className="sherwood-gallery__callout-watermark" aria-hidden="true">
                      <SchoolCrest size={72} />
                    </div>
                    <span className="sherwood-gallery__callout-badge">{item.tag}</span>
                    <strong className="sherwood-gallery__callout-title">{item.title}</strong>
                    <p className="sherwood-gallery__callout-text">
                      Step inside our mountain campus, houses, regattas, and laboratories.
                    </p>
                    <span className="sherwood-gallery__callout-cta">
                      Enter Archive <span>→</span>
                    </span>
                  </div>
                </Link>
              );
            }

            return (
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
            );
          })}
        </div>
      </div>
    </section>
  );
}
