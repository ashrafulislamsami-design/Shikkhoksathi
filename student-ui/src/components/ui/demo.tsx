import Footer4Col from "./footer-column";

export default function DemoOne() {
  return (
    <div style={{ backgroundColor: '#fcfaf5', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ padding: '4rem', textAlign: 'center', fontFamily: "'Bricolage Grotesque', sans-serif" }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1a3300', margin: 0 }} className="italic">Footer Integration Demo</h1>
        <p style={{ color: 'rgba(26,51,0,0.6)', marginTop: '1rem', fontSize: '1rem', fontWeight: 600 }}>
          This page demonstrates the newly integrated, responsive, neo-brutalist 4-column footer component.
        </p>
      </div>
      <Footer4Col />
    </div>
  );
}
