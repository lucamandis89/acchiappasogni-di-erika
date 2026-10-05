import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

function AdminRoute({ children }) {
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    let mounted = true

    async function checkAdmin() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          if (mounted) {
            setAllowed(false)
            setLoading(false)
          }
          return
        }

        const { data, error } =
          await supabase.rpc('is_admin')

        if (mounted) {
          setAllowed(!error && data === true)
          setLoading(false)
        }
      } catch (error) {
        console.error(
          'Errore controllo amministratore:',
          error
        )

        if (mounted) {
          setAllowed(false)
          setLoading(false)
        }
      }
    }

    checkAdmin()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      checkAdmin()
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <main
        style={{
          minHeight: '65vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          background: '#fdfbf8',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            color: '#766a64',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              margin: '0 auto 15px',
              border: '3px solid #eadfd9',
              borderTopColor: '#9a6252',
              borderRadius: '50%',
              animation:
                'adminRouteSpin .8s linear infinite',
            }}
          />

          <p
            style={{
              margin: 0,
              fontSize: '13px',
            }}
          >
            Verifica accesso...
          </p>

          <style>{`
            @keyframes adminRouteSpin {
              to {
                transform: rotate(360deg);
              }
            }
          `}</style>
        </div>
      </main>
    )
  }

  if (!allowed) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          message:
            "Devi accedere con un account amministratore per entrare nell'area riservata.",
        }}
      />
    )
  }

  return children
}

export default AdminRoute