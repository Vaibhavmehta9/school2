import React, { useState } from "react";
import { Link } from "react-router-dom";
import SchoolCrest from "../../../components/SchoolCrest";
import Card from "../../../components/Card/Card";
import "./EventsSection.css";

const homeEvents = {
  today: [
    { time: "11:00 AM", title: "Campus Tour & Admissions Counselling", location: "Admissions Secretariat" },
    { time: "03:30 PM", title: "Senior School Inter-House Debate", location: "Milman Hall Auditorium" },
  ],
  tomorrow: [
    { time: "10:00 AM", title: "New Parent Welcome & Orientation", location: "Main Assembly Hall" },
    { time: "02:00 PM", title: "Inter-House STEM & Robotics Showcase", location: "Science & Innovation Block" },
  ],
};

const homeNotices = {
  today: [
    {
      category: "Admissions",
      title: "Admissions Counselling Desk Open",
      text: "Our admissions counsellors are available on campus and via video consultation to assist with 2027–28 queries.",
      time: "Posted 2h ago",
    },
    {
      category: "Campus Life",
      title: "Annual Himalayan Trek Registration",
      text: "Orientation and medical clearance forms for the senior student autumn expedition are now downloadable.",
      time: "Posted 5h ago",
    },
  ],
  tomorrow: [
    {
      category: "Parents",
      title: "Term-End Parent Portal Updates",
      text: "Mid-term academic feedback reports and co-curricular assessments will be released via the Guardian Portal.",
      time: "Scheduled 9:00 AM",
    },
    {
      category: "Athletics",
      title: "Inter-School Cricket & Football Trials",
      text: "Senior and junior squad trials commence on the Sherwood College pavilion grounds.",
      time: "Scheduled 11:30 AM",
    },
  ],
};

export default function EventsSection() {
  const [eventsDay, setEventsDay] = useState("today");
  const [noticesDay, setNoticesDay] = useState("today");

  return (
    <section className="sherwood-events-notices">
      <div className="sherwood-events-notices__container">
        {/* Events Column */}
        <aside className="sherwood-events-card" aria-labelledby="upcoming-events-title">
          <div className="sherwood-events-card__header">
            <div>
              <span className="sherwood-section-label">COLLEGE CALENDAR</span>
              <h2 id="upcoming-events-title" className="sherwood-events-card__title">
                Upcoming <em>Events</em>
              </h2>
            </div>
            <div className="sherwood-events-tabs" role="tablist" aria-label="Select event day">
              {[["today", "Today"], ["tomorrow", "Tomorrow"]].map(([day, label]) => (
                <button
                  key={day}
                  type="button"
                  role="tab"
                  aria-selected={eventsDay === day}
                  className={`sherwood-events-tab ${eventsDay === day ? "sherwood-events-tab--active" : ""}`}
                  onClick={() => setEventsDay(day)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="sherwood-events-list">
            {homeEvents[eventsDay].map((event) => (
              <article className="sherwood-event-item" key={event.title}>
                <div className="sherwood-event-time">{event.time}</div>
                <div className="sherwood-event-info">
                  <h3>{event.title}</h3>
                  <p><span>⌖</span> {event.location}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="sherwood-events-card__footer">
            <Link className="sherwood-calendar-link" to="/calendar">
              View complete term calendar <span>→</span>
            </Link>
          </div>
        </aside>

        {/* Notices Column */}
        <div className="sherwood-notices-col" aria-labelledby="college-notices-title">
          <div className="sherwood-notices-header">
            <div>
              <span className="sherwood-section-label">CAMPUS DISPATCH</span>
              <h2 id="college-notices-title" className="sherwood-notices-title">
                What's Happening at <em>Sherwood</em>
              </h2>
            </div>
            <div className="sherwood-events-tabs" role="tablist" aria-label="Select notice day">
              {[["today", "Today"], ["tomorrow", "Tomorrow"]].map(([day, label]) => (
                <button
                  key={day}
                  type="button"
                  role="tab"
                  aria-selected={noticesDay === day}
                  className={`sherwood-events-tab ${noticesDay === day ? "sherwood-events-tab--active" : ""}`}
                  onClick={() => setNoticesDay(day)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="sherwood-notices-feed">
            {homeNotices[noticesDay].map((notice) => (
              <Card key={notice.title} variant="default" padding="md" className="sherwood-notice-card">
                <div className="sherwood-notice-card__top">
                  <div className="sherwood-notice-card__badge-wrap">
                    <SchoolCrest className="sherwood-notice-card__crest" />
                    <div>
                      <strong>Sherwood College</strong>
                      <small>{notice.time}</small>
                    </div>
                  </div>
                  <span className="sherwood-notice-category">{notice.category}</span>
                </div>
                <h3 className="sherwood-notice-card__title">{notice.title}</h3>
                <p className="sherwood-notice-card__text">{notice.text}</p>
                <div className="sherwood-notice-card__footer">
                  <a href="#contact" className="sherwood-notice-link">
                    Official College Notice <span>→</span>
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
