import {
  Feather,
  Heart,
  Sparkles,
  WandSparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'

function About() {
  return (
    <main className="about-page">
      <section className="about-hero">
        <div className="container-ery">
          <span className="about-kicker">
            Gli Acchiapasogni di Ery
          </span>

          <h1>
            Sogni intrecciati
            <br />
            <em>a mano</em>
          </h1>

          <p>
            Ogni creazione nasce lentamente, tra fili,
            colori, dettagli e ispirazione. Non esistono
            due acchiappasogni davvero uguali, perché
            dietro ognuno c'è una storia diversa.
          </p>
        </div>
      </section>

      <section className="about-story">
        <div className="container-ery">
          <div className="about-story-grid">
            <div className="about-art">
              <div className="dream-ring">
                <div className="dream-ring-inner">
                  <Sparkles size={38} />
                </div>

                <span className="thread thread-one" />
                <span className="thread thread-two" />
                <span className="thread thread-three" />

                <Feather
                  className="feather feather-one"
                  size={38}
                />
                <Feather
                  className="feather feather-two"
                  size={45}
                />
                <Feather
                  className="feather feather-three"
                  size={34}
                />
              </div>
            </div>

            <div className="about-copy">
              <span className="about-kicker">
                La mia storia
              </span>

              <h2>
                Ciao, sono Erika
              </h2>

              <p>
                Gli Acchiapasogni di Ery nascono dalla
                passione per il fatto a mano e dal
                desiderio di trasformare materiali,
                colori e piccoli dettagli in qualcosa di
                personale.
              </p>

              <p>
                Ogni acchiappasogni viene realizzato
                a mano, con cura e attenzione.
                Dal primo intreccio fino all'ultimo
                dettaglio, ogni pezzo prende forma uno
                alla volta.
              </p>

              <p>
                Mi piace creare oggetti capaci di
                raccontare qualcosa di chi li sceglie:
                un ricordo, una persona importante, un
                colore speciale o semplicemente un sogno
                da custodire.
              </p>

              <div className="about-signature">
                Erika
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="about-values">
        <div className="container-ery">
          <div className="about-section-title">
            <span className="about-kicker">
              Il cuore delle creazioni
            </span>

            <h2>
              Piccoli dettagli,
              <br />
              grandi significati
            </h2>
          </div>

          <div className="values-grid">
            <article>
              <div className="value-icon">
                <Heart size={23} />
              </div>

              <h3>Fatto con cura</h3>

              <p>
                Ogni creazione viene realizzata a mano,
                dedicandole il tempo necessario e
                curando ogni particolare.
              </p>
            </article>

            <article>
              <div className="value-icon">
                <WandSparkles size={23} />
              </div>

              <h3>Creato per te</h3>

              <p>
                Colori, nomi e dettagli possono
                trasformare un acchiappasogni in qualcosa
                di davvero personale.
              </p>
            </article>

            <article>
              <div className="value-icon">
                <Sparkles size={23} />
              </div>

              <h3>Ogni pezzo è speciale</h3>

              <p>
                La lavorazione a mano rende ogni
                creazione unica, con quelle piccole
                differenze che raccontano il fatto a
                mano.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="about-meaning">
        <div className="container-ery">
          <div className="meaning-card">
            <span className="about-kicker">
              Più di una decorazione
            </span>

            <h2>
              Un posto dove custodire
              <br />
              i sogni più belli
            </h2>

            <p>
              Un acchiappasogni può diventare un regalo,
              un ricordo o un piccolo simbolo da tenere
              vicino. Per questo ogni creazione può
              essere pensata per una persona, un momento
              o un'emozione particolare.
            </p>

            <div className="meaning-actions">
              <Link
                to="/shop"
                className="btn-primary"
              >
                Scopri le creazioni
              </Link>

              <Link
                to="/personalizzati"
                className="btn-outline"
              >
                Richiedi un personalizzato
              </Link>
            </div>
          </div>
        </div>
      </section>

      <style>{styles}</style>
    </main>
  )
}

const styles = `
  .about-page {
    min-height: 75vh;
    background: #fffdfb;
  }

  .about-hero {
    padding: 95px 0 90px;
    text-align: center;
    background:
      radial-gradient(
        circle at 20% 20%,
        rgba(224,169,155,.18),
        transparent 35%
      ),
      radial-gradient(
        circle at 82% 75%,
        rgba(144,153,139,.13),
        transparent 34%
      ),
      #fbf8f5;
    border-bottom:
      1px solid rgba(112,83,70,.08);
  }

  .about-kicker {
    color: var(--terracotta);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
  }

  .about-hero h1 {
    margin: 9px 0 18px;
    color: #443731;
    font-family:
      'Cormorant Garamond', serif;
    font-size: clamp(52px, 8vw, 78px);
    font-weight: 500;
    line-height: .95;
  }

  .about-hero h1 em {
    color: var(--terracotta);
    font-weight: 400;
  }

  .about-hero p {
    max-width: 630px;
    margin: 0 auto;
    color: #7c6f68;
    font-size: 13px;
    line-height: 1.9;
  }

  .about-story {
    padding: 95px 0;
  }

  .about-story-grid {
    max-width: 1000px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: .85fr 1.15fr;
    gap: 85px;
    align-items: center;
  }

  .about-art {
    min-height: 430px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 48% 48% 22px 22px;
    background:
      linear-gradient(
        145deg,
        rgba(224,169,155,.16),
        rgba(144,153,139,.11)
      );
  }

  .dream-ring {
    position: relative;
    width: 205px;
    height: 205px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 6px solid #a66d59;
    border-radius: 50%;
  }

  .dream-ring-inner {
    width: 145px;
    height: 145px;
    display: flex;
    align-items: center;
    justify-content: center;
    border:
      1px solid rgba(166,109,89,.42);
    border-radius: 50%;
    color: #c29b49;
  }

  .thread {
    position: absolute;
    top: 195px;
    width: 1px;
    background: #a66d59;
  }

  .thread-one {
    left: 47px;
    height: 80px;
  }

  .thread-two {
    left: 101px;
    height: 110px;
  }

  .thread-three {
    right: 47px;
    height: 75px;
  }

  .feather {
    position: absolute;
    color: #a66d59;
  }

  .feather-one {
    left: 28px;
    top: 255px;
    transform: rotate(8deg);
  }

  .feather-two {
    left: 79px;
    top: 285px;
  }

  .feather-three {
    right: 29px;
    top: 250px;
    transform: rotate(-8deg);
  }

  .about-copy h2,
  .about-section-title h2,
  .meaning-card h2 {
    color: #493d37;
    font-family:
      'Cormorant Garamond', serif;
    font-weight: 500;
  }

  .about-copy h2 {
    margin: 5px 0 22px;
    font-size: 43px;
  }

  .about-copy p {
    margin: 0 0 17px;
    color: #756861;
    font-size: 12px;
    line-height: 1.9;
  }

  .about-signature {
    margin-top: 25px;
    color: var(--terracotta);
    font-family:
      'Cormorant Garamond', serif;
    font-size: 32px;
    font-style: italic;
  }

  .about-values {
    padding: 85px 0 95px;
    background: #faf7f4;
  }

  .about-section-title {
    margin-bottom: 42px;
    text-align: center;
  }

  .about-section-title h2 {
    margin: 7px 0 0;
    font-size: 42px;
    line-height: 1.05;
  }

  .values-grid {
    max-width: 950px;
    margin: 0 auto;
    display: grid;
    grid-template-columns:
      repeat(3, 1fr);
    gap: 18px;
  }

  .values-grid article {
    padding: 32px 25px;
    border:
      1px solid rgba(112,83,70,.09);
    border-radius: 20px;
    background: white;
    text-align: center;
  }

  .value-icon {
    width: 52px;
    height: 52px;
    margin: 0 auto 17px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background:
      rgba(224,169,155,.17);
    color: var(--terracotta);
  }

  .values-grid h3 {
    margin: 0 0 10px;
    color: #50443e;
    font-family:
      'Cormorant Garamond', serif;
    font-size: 24px;
  }

  .values-grid p {
    margin: 0;
    color: #83766f;
    font-size: 10px;
    line-height: 1.8;
  }

  .about-meaning {
    padding: 90px 0;
  }

  .meaning-card {
    max-width: 830px;
    margin: 0 auto;
    padding: 65px 70px;
    border-radius: 28px;
    background:
      linear-gradient(
        135deg,
        rgba(144,153,139,.12),
        rgba(224,169,155,.12)
      );
    text-align: center;
  }

  .meaning-card h2 {
    margin: 8px 0 18px;
    font-size: 43px;
    line-height: 1.05;
  }

  .meaning-card p {
    max-width: 610px;
    margin: 0 auto;
    color: #756861;
    font-size: 11px;
    line-height: 1.9;
  }

  .meaning-actions {
    margin-top: 27px;
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 10px;
  }

  @media (max-width: 800px) {
    .about-story-grid {
      grid-template-columns: 1fr;
      gap: 55px;
    }

    .about-art {
      min-height: 400px;
    }

    .values-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 600px) {
    .about-hero {
      padding: 65px 0 60px;
    }

    .about-story,
    .about-values,
    .about-meaning {
      padding: 60px 0;
    }

    .about-copy h2,
    .about-section-title h2,
    .meaning-card h2 {
      font-size: 35px;
    }

    .meaning-card {
      padding: 45px 20px;
    }

    .about-art {
      min-height: 370px;
    }
  }
`

export default About