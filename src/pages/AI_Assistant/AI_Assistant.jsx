import { Link } from "react-router-dom";
import { useCognitoAuth } from "../../auth/useCognitoAuth";
import ChatPanel from "../../components/ChatPanel/ChatPanel";
import SchoolCrest from "../../components/SchoolCrest";
import "./AI_Assistant.css";

export default function AIAssistant() {
  const { user, session } = useCognitoAuth();

  return (
    <main className="ai-page">
      <header className="ai-header">
        <Link className="ai-brand" to="/dashboard">
          <SchoolCrest />
          <div>
            <strong>Sherwood</strong>
            <small>AI Assistant</small>
          </div>
        </Link>
        <Link to="/dashboard" className="ai-back-link">
          ← Dashboard
        </Link>
      </header>

      <section className="ai-container">
        <ChatPanel
          variant="page"
          accessToken={session?.accessToken}
          role={user?.role || "guest"}
        />
      </section>
    </main>
  );
}
