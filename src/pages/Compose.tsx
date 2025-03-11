
import ComposeMessage from '@/components/ComposeMessage';
import Layout from '@/components/Layout';
import { useNavigate } from 'react-router-dom';

const Compose = () => {
  const navigate = useNavigate();
  
  const handleSuccess = () => {
    // Navigate to dashboard after successful message send
    setTimeout(() => {
      navigate('/dashboard');
    }, 1000);
  };

  return (
    <Layout>
      <div className="flex flex-col space-y-8 animate-fade-in">
        <div className="flex flex-col space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">Compose Message</h1>
          <p className="text-muted-foreground">
            Send a direct message with a payment attached
          </p>
        </div>
        
        <ComposeMessage onSuccess={handleSuccess} />
      </div>
    </Layout>
  );
};

export default Compose;
