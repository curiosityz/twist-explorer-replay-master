
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export function NotFoundState() {
  const { txid } = useParams();

  return (
    <div className="min-h-screen bg-crypto-background text-crypto-foreground p-6">
      <header className="mb-8">
        <div className="flex items-center mb-4">
          <Button variant="outline" size="sm" asChild className="mr-2">
            <Link to="/transactions">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Transactions
            </Link>
          </Button>
        </div>
      </header>
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-crypto-foreground">Transaction Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Transaction with ID {txid} could not be found.</p>
          <div className="mt-4">
            <Button asChild>
              <Link to="/transactions">
                View All Transactions
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
